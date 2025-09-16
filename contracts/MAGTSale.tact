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
    fun OP_JETTON_TRANSFER(): Int { return 0x0f8a7ea5; } // jetton transfer
    fun OP_BUY(): Int { return 0xb0a1cafe; }            // наш op для покупки

    // Мінімальний буфер TON, який залишаємо на контракті (на сервісні витрати)
    fun GAS_BUFFER_TON(): Int { return ton("0.05"); }

    // Константи газу для переказу MAGT
    // Скільки TON форвардимо на JW покупця (щоб він зміг деплоїтись/обробитись)
    fun FWD_TO_RECIPIENT(): Int { return ton("0.03"); }
    // Скільки TON платимо на виклик SALE_JW (щоб він зміг переслати далі)
    fun CALL_VALUE(): Int { return ton("0.05"); }

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

    // -------------------- Внутрішній вхід: buy --------------------
    // Очікуємо internal message з опкодом OP_BUY у body
    // або порожній body (теж buy): cell [op:uint32, maybe_referrer:Maybe<address>] | empty
    receive(msg: Slice) {
        let tons: Int = context().value;
        require(tons > 0, "NO_TON");

        // парсимо body; якщо порожній — вважаємо buy без реферала
        let cs: Slice = msg;
        let buyer: Address = context().sender;

        // якщо в body є 32 біти — читаємо та перевіряємо op; якщо ні — приймаємо за OP_BUY
        if (cs.bits() >= 32) {
            let op_read: Int = cs.loadUint(32);
            require(op_read == self.OP_BUY(), "BAD_OP");
        }

        // дістаємо можливого реферала (optional) і фіксуємо його один раз
        if (cs.bits() >= 1) {
            let has_ref: Bool = cs.loadBit();
            if (has_ref && cs.bits() >= 267) {
                let ref_addr: Address = cs.loadAddress();
                if (!self.refOf.exists(buyer) && ref_addr != buyer) {
                    self.refOf.set(buyer, ref_addr);
                }
            }
        }

        // Перевірка, що платежу вистачає на виклики JW (покупець + опц. реферал) та буфер
        let willSendRef: Bool = self.refOf.exists(buyer) && self.refPoolLeftHuman > 0;
        let jwCalls: Int = 1 + (willSendRef ? 1 : 0);
        let needForJW: Int = jwCalls * self.CALL_VALUE();
        let needMin: Int = self.GAS_BUFFER_TON() + needForJW;
        require(tons >= needMin, "LOW_PAYMENT");

        // Скільки MAGT купити з урахуванням рівнів
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

    // Переказ MAGT із SALE_JW: response_destination → ПОКУПЕЦЬ
    fun send_jetton_transfer(jw: Address, amountRaw: Int, destination: Address) {
        let b = beginCell()
            .storeUint(self.OP_JETTON_TRANSFER(), 32)
            .storeUint(0, 64)                    // query_id
            .storeUint(amountRaw, 128)
            .storeAddress(destination)           // recipient
            .storeAddress(destination)           // ✅ response_destination = покупець
            .storeMaybeRef(null)                 // custom_payload = null
            .storeCoins(self.FWD_TO_RECIPIENT()) // forward_ton_amount
            .storeBit(false);                    // forward_payload: empty (Either left)

        send(SendParameters{
            to: jw,                              // SALE_JW
            value: self.CALL_VALUE(),            // вистачає на виконання + форвард
            bounce: true,
            mode: 1,                             // pay gas separately (із балансу контракту)
            body: b.endCell()
        });
    }
}
