// contracts/ClaimManager.tact
// Tact 1.x
// Простий клейм-менеджер для роздачі MAGT із власного JettonWallet (saleJW)

import "@stdlib/deploy";

struct AllocationInfo {
    amountHuman: Int; // у "людських" MAGT (без 10^decimals)
    claimed: Bool;
}

contract ClaimManager with Deployable {
    // -------- Константи/OP-коди --------
    fun OP_JETTON_TRANSFER(): Int { return 0x0f8a7ea5; }
    fun OP_SET_JW(): Int { return 0x53454a57; }       // "SEJW"
    fun OP_SET_ALLOC(): Int { return 0xa110c; }       // "ALLOC" (умовно)
    fun OP_CLAIM(): Int { return 0xc1a1; }            // "CLAIM" (умовно)

    fun GAS_BUFFER_TON(): Int { return ton("0.05"); }

    // -------- Змінні стану --------
    owner: Address;
    magtMinter: Address;
    magtDecimals: Int;

    // JettonWallet цього контракту (звідси підуть токени)
    saleJW: Address?;          // встановлюється окремим повідомленням owner'а

    allocations: map<Address, Int>;  // скільки може забрати addr (human MAGT)
    claimed: map<Address, Bool>;     // чи вже клеймав addr

    // -------- init --------
    init(owner: Address, magtMinter: Address, magtDecimals: Int) {
        self.owner = owner;
        self.magtMinter = magtMinter;
        self.magtDecimals = magtDecimals;

        // saleJW — null до встановлення
    }

    // -------- get-методи --------
    get fun get_owner(): Address { return self.owner; }
    get fun get_sale_jw(): Address? { return self.saleJW; }

    get fun get_allocation(addr: Address): AllocationInfo {
        let amount: Int = self.allocations.getOrElse(addr, 0);
        let wasClaimed: Bool = self.claimed.getOrElse(addr, false);
        return AllocationInfo{ amountHuman: amount, claimed: wasClaimed };
    }

    // -------- receive --------
    // Приймаємо:
    // 1) OP_SET_JW (тільки owner): body [op:uint32, jw:address]
    // 2) OP_SET_ALLOC (тільки owner): body [op:uint32, user:address, amountHuman:uint64]
    // 3) OP_CLAIM (від користувача): body [op:uint32]
    receive(msg: Slice) {
        let tons: Int = context().value;
        let sender: Address = context().sender;

        let cs: Slice = msg;
        if (cs.bits() >= 32) {
            let op: Int = cs.loadUint(32);

            // ---------- SET_JW ----------
            if (op == self.OP_SET_JW()) {
                require(sender == self.owner, "ONLY_OWNER");
                // читаємо адресу jw
                if (cs.bits() >= 267) {
                    let jw: Address = cs.loadAddress();
                    // установлюємо один раз або дозволяємо оновити — на твій розсуд
                    self.saleJW = jw;
                } else {
                    require(false, "NO_JW_ADDR");
                }
                return ();
            }

            // ---------- SET_ALLOC ----------
            if (op == self.OP_SET_ALLOC()) {
                require(sender == self.owner, "ONLY_OWNER");
                // [user:address, amountHuman:uint64]
                require(cs.bits() >= 267 + 64, "BAD_ALLOC_BODY");
                let userAddr: Address = cs.loadAddress();
                let amountHuman: Int = cs.loadUint(64);
                require(amountHuman >= 0, "NEG_AMOUNT");

                self.allocations.set(userAddr, amountHuman);
                // скидаємо claimed, якщо amountHuman > 0; якщо 0 — просто вважаємо як видалення виділення
                if (amountHuman > 0) {
                    self.claimed.set(userAddr, false);
                } else {
                    self.claimed.set(userAddr, false); // за потреби можна і видаляти ключ
                }
                return ();
            }

            // ---------- CLAIM ----------
            if (op == self.OP_CLAIM()) {
                // користувач клеймить без рефералів, просто свою аллокацію
                // вимагати якийсь мінімальний тон не обов'язково, але хай хоч трохи буде для газу
                require(tons >= ton("0.02"), "FEE_LOW");

                // saleJW має бути встановлений
                require(self.saleJW != null, "JW_NOT_SET");
                let jw: Address = self.saleJW!!;

                let amountHuman: Int = self.allocations.getOrElse(sender, 0);
                require(amountHuman > 0, "NO_ALLOC");

                let wasClaimed: Bool = self.claimed.getOrElse(sender, false);
                require(!wasClaimed, "ALREADY_CLAIMED");

                // відмічаємо як отримано ДО відправки токенів (щоб уникати повторів)
                self.claimed.set(sender, true);

                // конвертуємо в raw і шлемо transfer із saleJW
                let base: Int = self.pow10(self.magtDecimals);
                let amountRaw: Int = amountHuman * base;

                self.send_jetton_transfer(jw, amountRaw, sender);

                // ніякого форварду TON — просто повертаємося
                return ();
            }
        }

        // Якщо body не містить опкоду — ігноруємо
        return ();
    }

    // -------- utils --------
    fun pow10(decimals: Int): Int {
        let one = 1;
        let ten = 10;
        let res_init = one;
        let i_init = 0;
        let res = res_init;
        let i = i_init;
        while (i < decimals) {
            res = res * ten;
            i = i + 1;
        }
        return res;
    }

    fun send_jetton_transfer(jw: Address, amountRaw: Int, destination: Address) {
        let b = beginCell()
            .storeUint(self.OP_JETTON_TRANSFER(), 32)
            .storeUint(0, 64)               // query_id
            .storeUint(amountRaw, 128)
            .storeAddress(destination)       // destination
            .storeAddress(myAddress())       // response_destination
            .storeMaybeRef(null)             // custom_payload
            .storeCoins(0)                   // forward_ton_amount
            .storeBit(false);                // forward_payload: empty left

        send(SendParameters{
            to: jw,
            value: self.GAS_BUFFER_TON(),   // газ на дзвінок у JettonWallet
            bounce: true,
            mode: 1,
            body: b.endCell()
        });
    }
}
