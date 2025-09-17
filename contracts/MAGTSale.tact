// contracts/MAGTSale.tact
// Tact 1.x
// On-chain sale з рівнями та 5% рефералкою (в MAGT) з окремого пулу.
// Видача MAGT іде з попередньо поповненого JettonWallet контракту продажу (saleJW).

import "@stdlib/deploy";

// -------------------- Типи --------------------
struct Level {
    tokens: Int;  // кількість MAGT (у "людських" одиницях, без 10^decimals)
    price: Int;   // ціна у TON за 1 MAGT * 1e9 (нанотони за 1 MAGT)
}

struct LevelInfo {
    level: Int;
    remaining: Int;
    totalSold: Int;
}

struct RefQuery {
    exists: Bool;
    ref: Address?; // nullable для випадку без реферала
}

// -------------------- Контракт --------------------
contract MAGTSale with Deployable {
    fun OP_JETTON_TRANSFER(): Int { return 0x0f8a7ea5; } // jetton transfer (Jetton v1/v2)
    fun OP_BUY(): Int { return 0xb0a1cafe; }            // наш op для покупки
    fun OP_WITHDRAW(): Int { return 0x7777; }           // адмін-вивід TON

    // Мінімальний буфер TON на контракті (сервісні витрати)
    fun GAS_BUFFER_TON():   Int { return ton("0.01"); }

    // Газ на видачу MAGT
    // Скільки TON форвардимо одержувачу (на деплой/нотіф JW)
    fun FWD_TO_RECIPIENT(): Int { return ton("0.03"); }
    // Скільки TON кладемо на виклик SALE_JW (щоб він зміг відправити далі)
    fun CALL_VALUE():       Int { return ton("0.10"); } // піднято для стабільної відправки JW

    owner: Address;
    magtMinter: Address;
    saleJW: Address;          // JettonWallet цього контракту (для MAGT)
    magtDecimals: Int;        // зазвичай 9

    levels: map<Int, Level>;  // 0..19
    currentLevel: Int;
    remainingInLevel: Int;

    totalSoldHuman: Int;
    refPoolLeftHuman: Int;
    refOf: map<Address, Address>;

    // -------------------- init --------------------
    init(
        owner: Address,
        magtMinter: Address,
        saleJW: Address,
        magtDecimals: Int,
        levelsInit: map<Int, Level>,
        startLevel: Int,
        startRemaining: Int,
        refPoolHuman: Int
    ) {
        self.owner = owner;
        self.magtMinter = magtMinter;
        self.saleJW = saleJW;
        self.magtDecimals = magtDecimals;

        self.levels = levelsInit;
        self.currentLevel = startLevel;
        self.remainingInLevel = startRemaining;

        self.totalSoldHuman = 0;
        self.refPoolLeftHuman = refPoolHuman;
        // self.refOf — zero-value
    }

    // -------------------- get-методи --------------------
    get fun get_owner(): Address { return self.owner; }

    get fun get_level(): LevelInfo {
        return LevelInfo{
            level: self.currentLevel,
            remaining: self.remainingInLevel,
            totalSold: self.totalSoldHuman
        };
    }

    get fun get_ref_pool_left(): Int { return self.refPoolLeftHuman; }

    get fun get_referrer(addr: Address): RefQuery {
        if (self.refOf.exists(addr)) {
            return RefQuery{ exists: true, ref: self.refOf.get(addr) };
        } else {
            return RefQuery{ exists: false, ref: null };
        }
    }

    // -------------------- Внутрішній вхід --------------------
    receive(msg: Slice) {
        let sender: Address = context().sender;

        // --- 1) Адмін-вивід TON: [OP_WITHDRAW:uint32, amount:coins] ---
        if (msg.bits() >= 32) {
            let op_pre = msg.preloadUint(32);
            if (op_pre == self.OP_WITHDRAW()) {
                let _ = msg.loadUint(32);
                let amount: Int = msg.loadCoins();
                require(sender == self.owner, "NOT_OWNER");
                self.send_raw_ton(self.owner, amount);
                return;
            }
        }

        // --- 2) Покупка (OP_BUY або порожній body) ---
        let cs: Slice = msg;
        if (cs.bits() != 0) {
            if (cs.bits() < 32) {
                // незрозумілий payload — ігнор
                return;
            }
            let op_read: Int = cs.loadUint(32);
            if (op_read != self.OP_BUY()) {
                // НЕ наша операція (наприклад, нотифікація від JW) — тихо ігноруємо
                return;
            }
        }

        let buyer: Address = sender;
        let tons: Int = context().value;
        require(tons > 0, "NO_TON");

        // опційний реферал (тільки для покупки)
        if (cs.bits() >= 1) {
            let has_ref: Bool = cs.loadBit();
            if (has_ref && cs.bits() >= 267) {
                let ref_addr: Address = cs.loadAddress();
                if (!self.refOf.exists(buyer) && ref_addr != buyer) {
                    self.refOf.set(buyer, ref_addr);
                }
            }
        }

        // Мінімум для покриття викликів JW (покупець + опц. реферал) та буфер
        let willSendRef: Bool = self.refOf.exists(buyer) && self.refPoolLeftHuman > 0;
        let jwCalls: Int = 1 + (willSendRef ? 1 : 0);
        let needForJW: Int = jwCalls * self.CALL_VALUE();
        let needMin: Int = self.GAS_BUFFER_TON() + needForJW;
        require(tons >= needMin, "LOW_PAYMENT");

        // Розрахунок кількості MAGT з урахуванням рівнів
        let paymentNano: Int = tons;
        let toBuyHuman: Int = self.calc_human_tokens_from_ton(paymentNano);
        require(toBuyHuman > 0, "ZERO_OUTPUT");

        // Оновлюємо рівні/лічильники
        let remaining = toBuyHuman;
        while (remaining > 0) {
            let lvl: Int = self.currentLevel;
            require(self.levels.exists(lvl), "LEVEL_OOB");
            let r_now: Int = self.remainingInLevel;
            if (remaining <= r_now) {
                self.remainingInLevel = r_now - remaining;
                remaining = 0;
            } else {
                remaining = remaining - r_now;
                self.currentLevel = lvl + 1;
                if (!self.levels.exists(self.currentLevel)) {
                    self.remainingInLevel = 0;
                    remaining = 0;
                } else {
                    let nextOpt: Level? = self.levels.get(self.currentLevel);
                    require(nextOpt != null, "LEVEL_MISSING");
                    let next: Level = nextOpt!!;
                    self.remainingInLevel = next.tokens;
                }
            }
        }

        self.totalSoldHuman = self.totalSoldHuman + toBuyHuman;

        // Реф-бонус 5% у MAGT (з refPoolLeftHuman)
        let bonusHuman = 0;
        if (willSendRef) {
            let five: Int = toBuyHuman * 5 / 100; // floor
            if (five > 0) {
                let grant: Int = self.min(self.refPoolLeftHuman, five);
                bonusHuman = grant;
                self.refPoolLeftHuman = self.refPoolLeftHuman - grant;
            }
        }

        // Видача MAGT: human -> raw
        let base: Int = self.pow10(self.magtDecimals);
        let amountBuyerRaw: Int = toBuyHuman * base;
        let amountRefRaw: Int = bonusHuman * base;

        // 1) jetton transfer покупцю
        self.send_jetton_transfer(self.saleJW, amountBuyerRaw, buyer);

        // 2) jetton transfer рефералу (якщо > 0)
        if (amountRefRaw > 0 && self.refOf.exists(buyer)) {
            let refFinalOpt: Address? = self.refOf.get(buyer);
            require(refFinalOpt != null, "REF_NOT_SET");
            let ref_final: Address = refFinalOpt!!;
            self.send_jetton_transfer(self.saleJW, amountRefRaw, ref_final);
        }

        // 3) форвард TON → owner (мінус буфер та витрати на виклики JW)
        let toOwner: Int = self.max(0, paymentNano - needMin);
        if (toOwner > 0) {
            self.send_raw_ton(self.owner, toOwner);
        }
    }

    // -------------------- Допоміжні функції --------------------
    fun min(a: Int, b: Int): Int { if (a < b) { return a; } else { return b; } }
    fun max(a: Int, b: Int): Int { if (a > b) { return a; } else { return b; } }

    fun pow10(decimals: Int): Int {
        let one = 1; let ten = 10; let res_init = one; let i_init = 0;
        let res = res_init; let i = i_init;
        while (i < decimals) { res = res * ten; i = i + 1; }
        return res;
    }

    // MAGT_human = floor(paymentNano / priceNanoTonPerToken) з урахуванням рівнів
    fun calc_human_tokens_from_ton(paymentNano: Int): Int {
        let left_init = paymentNano;
        let out_init = 0;

        let lvl_init = self.currentLevel;
        let rem_init = self.remainingInLevel;

        let leftNano = left_init;
        let outHuman = out_init;
        let lvl = lvl_init;
        let rem = rem_init;

        while (leftNano > 0 && self.levels.exists(lvl) && rem > 0) {
            let Lopt: Level? = self.levels.get(lvl);
            require(Lopt != null, "LEVEL_NULL");
            let L: Level = Lopt!!;
            let priceNano: Int = L.price;

            let mayBuy: Int = leftNano / priceNano;

            if (mayBuy > 0) {
                let take: Int = self.min(rem, mayBuy);
                outHuman = outHuman + take;
                rem = rem - take;
                leftNano = leftNano - (take * priceNano);

                if (rem == 0) {
                    lvl = lvl + 1;
                    if (self.levels.exists(lvl)) {
                        let nextOpt: Level? = self.levels.get(lvl);
                        require(nextOpt != null, "LEVEL_NULL_2");
                        let next: Level = nextOpt!!;
                        rem = next.tokens;
                    } else {
                        rem = 0;
                    }
                }
            } else {
                rem = 0;
            }
        }
        return outHuman;
    }

    fun send_raw_ton(to: Address, amountNano: Int) {
        send(SendParameters{ to: to, value: amountNano, bounce: false });
    }

    // Переказ MAGT із SALE_JW: правильне тіло Jetton Transfer
    // amountRaw: uint128 токенів (з урахуванням 10^decimals)
    // destination: власник-покупець (НЕ JW!)
    fun send_jetton_transfer(jw: Address, amountRaw: Int, destination: Address) {
        // ✅ forward_payload = Right ^empty (багато JW це вимагають)
        // ✅ response_destination = SALE (для нотифікацій)
        let empty = beginCell().endCell();

        let b = beginCell()
            .storeUint(self.OP_JETTON_TRANSFER(), 32)  // opcode
            .storeUint(0, 64)                          // query_id
            .storeUint(amountRaw, 128)                 // amount (uint128)
            .storeAddress(destination)                 // recipient owner
            .storeAddress(myAddress())                 // response_destination = SALE
            .storeMaybeRef(null)                       // custom_payload = null
            .storeCoins(self.FWD_TO_RECIPIENT())       // forward_ton_amount
            .storeBit(true).storeRef(empty);           // forward_payload: right ^empty

        send(SendParameters{
            to: jw,                                    // SALE_JW
            value: self.CALL_VALUE(),                  // достатньо на виконання + форвард
            bounce: true,
            mode: 1,                                   // PAY_GAS_SEPARATELY
            body: b.endCell()
        });
    }
}
