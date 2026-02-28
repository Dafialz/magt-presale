import "@stdlib/deploy";

// -----------------------------
// Presale messages / opcodes
// -----------------------------

message(0x434C4149) Claim { // "CLAI"
  query_id: Int as uint64; // ignored
}

/*
  IMPORTANT FIX:
  - DO NOT use opcode 0x42555901 for a typed message, because manual payload encoding
    doesn't match Tact's Address? encoding. Typed decode reverts => bounce.
  - We keep 0x42555901 as MANUAL BUY opcode handled by receive(inMsg: Slice).
  - ABI/typed buy gets a DIFFERENT opcode (0x42555902).
*/
message(0x42555902) BuyAbi { // "BUY"+2 (ABI only)
  ref: Address?;
}

message(0x57495448) Withdraw { // "WITH"
  amount: Int; // nanoTON
}

message(0x574A544E) WithdrawJettons { // "WJTN"
  to: Address;
  amount: Int; // nanojettons (9 decimals)
  query_id: Int; // ignored for safety
}

message SetJettonWallet {
  wallet: Address;
}

/*
  ResolvePending:
  action: Int
    2 = restore only
  SECURITY:
  - allow either OWNER or USER to call restore (after TTL)
*/
message ResolvePending {
  user: Address;
  action: Int; // 2=force restore only (commit is via CancelPending / Jetton callbacks)
}

message CancelPending {}

// ✅ NEW: owner toggles presale on/off (so simple topups don't mint claimables)
message SetPresaleEnabled {
  enabled: Int; // 1=enabled, 0=disabled
}

// Jetton standard callbacks:
// 1) transfer_notification (sent from JettonWallet to DESTINATION on successful transfer)
message(0x7362d09c) JettonTransferNotification {
  query_id: Int as uint64;
  amount: Int;     // coins (nanojettons)
  sender: Address; // sender/owner per jetton implementation (do NOT rely on it)
  forward_payload: Cell;
}

// 2) excesses (optional, sent to response_destination)
message(0xd53276db) JettonExcesses {
  query_id: Int as uint64;
}

// -----------------------------
// Presale contract
// -----------------------------

contract Presale with Deployable {
  // =============================
  // Storage
  // =============================

  owner_: Address;

  jettonMaster_: Address;
  jettonWallet_: Address?;

  // ✅ NEW: presale starts DISABLED by default (prevents accidental minting)
  presaleEnabled_: Int; // 0/1

  // sold/raised
  totalSoldNano_: Int;    // nanojettons
  totalRaisedNano_: Int;  // nanoTON

  // rounds
  currentRound_: Int;         // 0..MAX_ROUND
  currentRoundSoldNano_: Int; // nanojettons

  // claimables (nanojettons) - kept for backward compat / UI getters,
  // but NO LONGER the source-of-truth for Claim().
  claimableBuyer_: map<Address, Int>;
  claimableReferral_: map<Address, Int>;

  // SOURCE OF TRUTH (anti-bug accounting)
  // credited = earned via buys/ref; claimed = already claimed OR pending-claimed
  creditedBuyer_: map<Address, Int>;
  creditedRef_: map<Address, Int>;
  claimedBuyer_: map<Address, Int>;
  claimedRef_: map<Address, Int>;

  // pending (nanojettons)
  pendingTotal_: map<Address, Int>;
  pendingBuyer_: map<Address, Int>;
  pendingReferral_: map<Address, Int>;
  pendingUntil_: map<Address, Int>;
  pendingQid_: map<Address, Int>; // uint64 stored in Int

  // qid generator (unique per outgoing jetton transfer)
  nextQid_: Int;

  // qid -> user + explicit presence flag (Tact map values cannot be optional)
  userByQid_: map<Int, Address>;
  userByQidPresent_: map<Int, Int>; // 1=active, 0=cleared

  // totals
  totalClaimableNano_: Int; // nanojettons
  totalPendingNano_: Int;   // nanojettons

  // =============================
  // Constants
  // =============================

  // IMPORTANT: bump this to force NEW contract address on deploy (code hash changes)
  const CODE_VERSION: Int = 16; // bumped after userByQid_ optional-map removal

  const OP_JETTON_TRANSFER: Int = 0x0f8a7ea5; // JettonWallet::transfer opcode

  // MANUAL BUY opcode (handled only by receive(inMsg: Slice))
  const OP_BUY_MANUAL: Int = 0x42555901; // "BUY"+1

  // Bonuses (PPM)
  const BUYER_BONUS_PPM: Int = 50000;    // 5% buyer bonus
  const REF_POOL_BONUS_PPM: Int = 50000; // 5% referrer pool

  // Jetton wallet call value
  const JETTON_WALLET_CALL_VALUE: Int = 600000000; // 0.60 TON
  const FORWARD_TON_TO_CLAIMER: Int = 10000000;    // 0.01 TON

  // Withdraw safety
  const WITHDRAW_MIN_KEEP_TON: Int = 2000000000; // 2 TON
  const WITHDRAW_GAS_BUFFER: Int = 300000000;    // 0.30 TON

  // Claim safety
  const CLAIM_TTL_SEC: Int = 180;

  // Anti-drain: require caller to attach TON to cover jetton-wallet call
  const MIN_CLAIM_ATTACHED_TON: Int = 700000000; // 0.70 TON
  const CLAIM_KEEP_TON: Int = 900000000;         // 0.90 TON keep after operations

  // BUY refund safety (avoid dust that can fail due to fees)
  const MIN_REFUND_NANO: Int = 10000000; // 0.01 TON

  // Math
  const NANO_JETTON: Int = 1000000000; // 1 token = 1e9 nanojetton (9 decimals)
  const MAX_ROUND: Int = 19;

  // uint64 modulus (2^64)
  const U64_MOD: Int = 18446744073709551616;

  // =============================
  // Init
  // =============================

  init(owner: Address, jettonMaster: Address) {
    self.owner_ = owner;

    self.jettonMaster_ = jettonMaster;
    self.jettonWallet_ = null;

    // ✅ presale disabled by default
    self.presaleEnabled_ = 0;

    self.totalSoldNano_ = 0;
    self.totalRaisedNano_ = 0;

    self.currentRound_ = 0;
    self.currentRoundSoldNano_ = 0;

    self.claimableBuyer_ = emptyMap();
    self.claimableReferral_ = emptyMap();

    self.creditedBuyer_ = emptyMap();
    self.creditedRef_ = emptyMap();
    self.claimedBuyer_ = emptyMap();
    self.claimedRef_ = emptyMap();

    self.pendingTotal_ = emptyMap();
    self.pendingBuyer_ = emptyMap();
    self.pendingReferral_ = emptyMap();
    self.pendingUntil_ = emptyMap();
    self.pendingQid_ = emptyMap();

    self.nextQid_ = 1;
    self.userByQid_ = emptyMap();
    self.userByQidPresent_ = emptyMap();

    self.totalClaimableNano_ = 0;
    self.totalPendingNano_ = 0;
  }

  // =============================
  // Presale enable/disable (owner)
  // =============================

  receive(msg: SetPresaleEnabled) {
    require(sender() == self.owner_, "NOT_OWNER");
    self.presaleEnabled_ = (msg.enabled != 0) ? 1 : 0;
  }

  // =============================
  // Set Jetton Wallet (one-time)
  // =============================

  receive(msg: SetJettonWallet) {
    require(sender() == self.owner_, "NOT_OWNER");
    require(msg.wallet != myAddress(), "BAD_WALLET");
    require(self.jettonWallet_ == null, "JETTON_WALLET_ALREADY_SET");
    self.jettonWallet_ = msg.wallet;
  }

  // =============================
  // Owner actions
  // =============================

  receive(msg: Withdraw) {
    require(sender() == self.owner_, "NOT_OWNER");
    require(msg.amount > 0, "BAD_AMOUNT");

    require(
      myBalance() - msg.amount >= self.WITHDRAW_MIN_KEEP_TON + self.WITHDRAW_GAS_BUFFER,
      "KEEP_MIN_BALANCE"
    );

    send(SendParameters{
      to: self.owner_,
      value: msg.amount,
      bounce: false,
      mode: SendPayGasSeparately,
      body: emptyCell()
    });
  }

  receive(msg: WithdrawJettons) {
    require(sender() == self.owner_, "NOT_OWNER");
    require(self.jettonWallet_ != null, "JETTON_WALLET_NOT_SET");
    require(msg.amount > 0, "BAD_AMOUNT");

    require(self.totalClaimableNano_ == 0, "CLAIMABLE_EXISTS");
    require(self.totalPendingNano_ == 0, "PENDING_EXISTS");

    let qid = self.allocQid();
    self.sendJettonTo(msg.to, msg.amount, qid);
  }

  // SECURITY: allow either OWNER or USER to call restore (after TTL)
  receive(msg: ResolvePending) {
    let a = msg.user;

    require(sender() == self.owner_ || sender() == a, "NOT_OWNER_OR_USER");
    require(self.isPending(a), "NO_PENDING");
    require(now() > self.pendingUntil(a), "PENDING_NOT_EXPIRED");
    require(msg.action == 2, "ONLY_RESTORE_ALLOWED");

    let qid = self.pendingQid(a);
    self.restorePending(qid);
  }

  // =============================
  // BUY (robust / no-bounce)
  // =============================

  // Pure TON transfer (no body)
  receive() {
    // ✅ IMPORTANT: if presale is disabled, treat as simple topup and refund back
    let buyer = sender();
    let sent = context().value;
    if (self.presaleEnabled_ == 0) {
      if (sent > 0) { self.refundAll(buyer, sent); }
      return;
    }
    self.processBuy(null);
  }

  // ABI typed buy uses DIFFERENT opcode (0x42555902)
  receive(msg: BuyAbi) {
    // ✅ If presale disabled: refund
    let buyer = sender();
    let sent = context().value;
    if (self.presaleEnabled_ == 0) {
      if (sent > 0) { self.refundAll(buyer, sent); }
      return;
    }

    if (msg.ref != null && msg.ref!! == sender()) {
      self.processBuy(null);
    } else {
      self.processBuy(msg.ref);
    }
  }

  // Fallback: parse body manually (ONLY MANUAL BUY opcode 0x42555901)
  receive(inMsg: Slice) {
    let buyer = sender();
    let sent = context().value;

    // ✅ If presale disabled: refund regardless of payload
    if (self.presaleEnabled_ == 0) {
      if (sent > 0) { self.refundAll(buyer, sent); }
      return;
    }

    if (inMsg.bits() < 32) {
      if (sent > 0) { self.refundAll(buyer, sent); }
      return;
    }

    let op = inMsg.loadUint(32);

    if (op != self.OP_BUY_MANUAL) {
      if (sent > 0) { self.refundAll(buyer, sent); }
      return;
    }

    // Manual encoding we expect:
    // [op:32][has_ref:1][ref_addr if has_ref=1]
    let ref: Address? = null;

    if (inMsg.bits() >= 1) {
      let has = inMsg.loadBit();
      if (has) {
        if (inMsg.bits() >= 267) {
          ref = inMsg.loadAddress();
        }
      }
    }

    if (ref != null && ref!! == buyer) {
      self.processBuy(null);
    } else {
      self.processBuy(ref);
    }
  }

  // refund must NOT use SendPayGasSeparately, otherwise refunding full amount can revert on 0-balance contracts
  fun refundAll(to: Address, amount: Int) {
    if (amount <= 0) { return; }
    send(SendParameters{
      to: to,
      value: amount,
      bounce: false,
      body: emptyCell()
      // mode omitted => gas is paid from value (safe for "refund all")
    });
  }

  fun processBuy(ref: Address?) {
    let buyer = sender();
    let sent = context().value;

    if (sent <= 0) { return; }

    if (self.isPresaleEnded()) {
      self.refundAll(buyer, sent);
      return;
    }

    let tonLeft = sent;
    let totalTokensNano = 0;

    let done: Bool = false;
    let guard = 0;

    while (!done) {
      guard = guard + 1;

      if (guard >= 200) {
        done = true;
      } else if (tonLeft <= 0) {
        done = true;
      } else if (self.isPresaleEnded()) {
        done = true;
      } else {
        if (!(self.currentRound_ >= 0 && self.currentRound_ <= self.MAX_ROUND)) {
          done = true;
        } else {
          let capNano = self.roundCapNano(self.currentRound_);
          let priceNano = self.roundPriceNano(self.currentRound_);

          if (capNano <= 0 || priceNano <= 0) {
            done = true;
          } else {
            let remaining = capNano - self.currentRoundSoldNano_;

            if (remaining <= 0) {
              if (self.currentRound_ >= self.MAX_ROUND) {
                done = true;
              } else {
                self.currentRound_ = self.currentRound_ + 1;
                self.currentRoundSoldNano_ = 0;
              }
            } else {
              let wantNano = (tonLeft * self.NANO_JETTON) / priceNano;

              if (wantNano <= 0) {
                done = true;
              } else {
                let buyNano = wantNano;
                if (buyNano > remaining) { buyNano = remaining; }

                // spent = ceil(buyNano * priceNano / NANO_JETTON)
                let spentRaw = buyNano * priceNano;
                let spent = spentRaw / self.NANO_JETTON;
                if (spent * self.NANO_JETTON < spentRaw) {
                  spent = spent + 1;
                }

                if (spent <= 0) {
                  done = true;
                } else if (spent > tonLeft) {
                  spent = spentRaw / self.NANO_JETTON;
                  if (spent <= 0) {
                    done = true;
                  } else {
                    self.currentRoundSoldNano_ = self.currentRoundSoldNano_ + buyNano;
                    self.totalSoldNano_ = self.totalSoldNano_ + buyNano;
                    self.totalRaisedNano_ = self.totalRaisedNano_ + spent;

                    totalTokensNano = totalTokensNano + buyNano;
                    tonLeft = tonLeft - spent;

                    if (tonLeft < 0) { tonLeft = 0; }
                  }
                } else {
                  self.currentRoundSoldNano_ = self.currentRoundSoldNano_ + buyNano;
                  self.totalSoldNano_ = self.totalSoldNano_ + buyNano;
                  self.totalRaisedNano_ = self.totalRaisedNano_ + spent;

                  totalTokensNano = totalTokensNano + buyNano;
                  tonLeft = tonLeft - spent;

                  if (tonLeft < 0) { tonLeft = 0; }
                }
              }
            }
          }
        }
      }
    }

    if (totalTokensNano <= 0) {
      self.refundAll(buyer, sent);
      return;
    }

    // Buyer bonus
    let buyerBonus = (totalTokensNano * self.BUYER_BONUS_PPM) / 1000000;
    let totalForBuyer = totalTokensNano + buyerBonus;

    // Referral pool
    let refBonus = (totalTokensNano * self.REF_POOL_BONUS_PPM) / 1000000;

    // accounting
    self.addClaimableBuyer(buyer, totalForBuyer);

    if (ref != null) {
      if (ref!! != buyer && refBonus > 0) {
        self.addClaimableReferral(ref!!, refBonus);
      }
    }

    // Refund leftover
    if (tonLeft >= self.MIN_REFUND_NANO) {
      self.refundAll(buyer, tonLeft);
    }
  }

  // =============================
  // Claim
  // =============================

  receive(msg: Claim) {
    require(self.jettonWallet_ != null, "JETTON_WALLET_NOT_SET");

    require(context().value >= self.MIN_CLAIM_ATTACHED_TON, "ATTACH_MORE_TON");
    require(myBalance() >= self.CLAIM_KEEP_TON, "LOW_BALANCE");

    let a = sender();

    require(!self.isPending(a), "CLAIM_PENDING_TRY_LATER");

    let buyerCred    = self.creditedBuyer_.exists(a)  ? self.creditedBuyer_.get(a)!!  : 0;
    let refCred      = self.creditedRef_.exists(a)    ? self.creditedRef_.get(a)!!    : 0;
    let buyerClaimed = self.claimedBuyer_.exists(a)   ? self.claimedBuyer_.get(a)!!  : 0;
    let refClaimed   = self.claimedRef_.exists(a)     ? self.claimedRef_.get(a)!!    : 0;

    let buyerAmount = buyerCred - buyerClaimed;
    let refAmount   = refCred   - refClaimed;

    if (buyerAmount < 0) { buyerAmount = 0; }
    if (refAmount < 0)   { refAmount = 0;   }

    let amount = buyerAmount + refAmount;
    require(amount > 0, "NOTHING_TO_CLAIM");

    require(self.totalClaimableNano_ >= amount, "INTERNAL_CLAIMABLE_UNDERFLOW");

    let qid = self.allocQid();

    self.setPending(a, amount, buyerAmount, refAmount, qid);

    self.totalClaimableNano_ = self.totalClaimableNano_ - amount;
    self.totalPendingNano_   = self.totalPendingNano_   + amount;

    let curBClaimed = self.claimedBuyer_.exists(a) ? self.claimedBuyer_.get(a)!! : 0;
    self.claimedBuyer_.set(a, curBClaimed + buyerAmount);

    let curRClaimed = self.claimedRef_.exists(a) ? self.claimedRef_.get(a)!! : 0;
    self.claimedRef_.set(a, curRClaimed + refAmount);

    self.claimableBuyer_.set(a, 0);
    self.claimableReferral_.set(a, 0);

    self.sendJettonTo(a, amount, qid);
  }

  // CancelPending — user commits pending ONLY after TTL.
  receive(msg: CancelPending) {
    let a = sender();
    require(self.isPending(a), "NO_PENDING");
    require(now() > self.pendingUntil(a), "PENDING_NOT_EXPIRED");

    let qid = self.pendingQid(a);
    self.commitPending(qid);
  }

  // =============================
  // Bounced / Jetton callbacks
  // =============================

  bounced(inMsg: Slice) {
    if (inMsg.bits() < (32 + 64)) { return; }

    let op = inMsg.loadUint(32);
    if (op != self.OP_JETTON_TRANSFER) { return; }

    let qid = inMsg.loadUint(64);
    self.restorePending(qid);
  }

  receive(msg: JettonTransferNotification) {
    if (self.jettonWallet_ == null) { return; }
    if (sender() != self.jettonWallet_!!) { return; }

    self.commitPending(msg.query_id);
  }

  receive(msg: JettonExcesses) {
    if (self.jettonWallet_ == null) { return; }
    if (sender() != self.jettonWallet_!!) { return; }

    self.commitPending(msg.query_id);
  }

  // =============================
  // Getters (front/check)
  // =============================

  get fun codeVersion(): Int { return self.CODE_VERSION; }

  get fun ownerGetter(): Address { return self.owner_; }
  get fun jettonMasterGetter(): Address { return self.jettonMaster_; }

  // ✅ NEW: expose enabled flag
  get fun presaleEnabledGetter(): Int { return self.presaleEnabled_; }

  get fun totalSoldNano(): Int { return self.totalSoldNano_; }
  get fun totalRaisedNano(): Int { return self.totalRaisedNano_; }
  get fun currentRound(): Int { return self.currentRound_; }
  get fun currentRoundSoldNano(): Int { return self.currentRoundSoldNano_; }

  get fun jettonWalletSet(): Int { return self.jettonWallet_ != null ? 1 : 0; }
  get fun jettonWallet(): Address? { return self.jettonWallet_; }

  get fun claimableBuyerNano(addr: Address): Int {
    let credited = self.creditedBuyer_.exists(addr) ? self.creditedBuyer_.get(addr)!! : 0;
    let claimed  = self.claimedBuyer_.exists(addr)  ? self.claimedBuyer_.get(addr)!!  : 0;
    let v = credited - claimed;
    return v > 0 ? v : 0;
  }

  get fun claimableReferralNano(addr: Address): Int {
    let credited = self.creditedRef_.exists(addr) ? self.creditedRef_.get(addr)!! : 0;
    let claimed  = self.claimedRef_.exists(addr)  ? self.claimedRef_.get(addr)!!  : 0;
    let v = credited - claimed;
    return v > 0 ? v : 0;
  }

  get fun totalClaimableNano(): Int { return self.totalClaimableNano_; }
  get fun totalPendingNano(): Int { return self.totalPendingNano_; }

  get fun roundCapNanoGetter(round: Int): Int { return self.roundCapNano(round); }
  get fun roundPriceNanoGetter(round: Int): Int { return self.roundPriceNano(round); }

  get fun isPendingGetter(addr: Address): Int { return self.isPending(addr) ? 1 : 0; }
  get fun pendingUntilGetter(addr: Address): Int { return self.pendingUntil(addr); }
  get fun pendingQidGetter(addr: Address): Int { return self.pendingQid(addr); }

  // =============================
  // Internal helpers
  // =============================

  fun allocQid(): Int {
    let qid = self.nextQid_ % self.U64_MOD;
    if (qid <= 0) { qid = 1; }

    self.nextQid_ = (self.nextQid_ + 1) % self.U64_MOD;
    if (self.nextQid_ <= 0) { self.nextQid_ = 1; }

    return qid;
  }

  fun isPending(a: Address): Bool {
    return self.pendingTotal_.exists(a) && self.pendingTotal_.get(a)!! > 0;
  }

  fun pendingUntil(a: Address): Int {
    if (self.pendingUntil_.exists(a)) { return self.pendingUntil_.get(a)!!; }
    return 0;
  }

  fun pendingQid(a: Address): Int {
    if (self.pendingQid_.exists(a)) { return self.pendingQid_.get(a)!!; }
    return 0;
  }

  fun setPending(a: Address, total: Int, buyerPart: Int, refPart: Int, qid: Int) {
    self.pendingTotal_.set(a, total);
    self.pendingBuyer_.set(a, buyerPart);
    self.pendingReferral_.set(a, refPart);
    self.pendingUntil_.set(a, now() + self.CLAIM_TTL_SEC);
    self.pendingQid_.set(a, qid);

    self.userByQid_.set(qid, a);
    self.userByQidPresent_.set(qid, 1);
  }

  fun clearPending(a: Address) {
    self.pendingTotal_.set(a, 0);
    self.pendingBuyer_.set(a, 0);
    self.pendingReferral_.set(a, 0);
    self.pendingUntil_.set(a, 0);
    self.pendingQid_.set(a, 0);
  }

  fun safeSubPendingTotal(amount: Int) {
    if (amount <= 0) { return; }
    if (self.totalPendingNano_ >= amount) {
      self.totalPendingNano_ = self.totalPendingNano_ - amount;
    } else {
      self.totalPendingNano_ = 0;
    }
  }

  fun commitPending(qid: Int) {
    if (!self.userByQidPresent_.exists(qid)) { return; }
    let active = self.userByQidPresent_.get(qid)!!;
    if (active == 0) { return; }
    if (!self.userByQid_.exists(qid)) { return; }
    let a = self.userByQid_.get(qid)!!;

    if (!self.isPending(a)) { return; }
    if (self.pendingQid(a) != qid) { return; }

    let amount = self.pendingTotal_.get(a)!!;

    self.safeSubPendingTotal(amount);
    self.clearPending(a);

    // cleanup mapping presence (address value can remain stale but inactive)
    self.userByQidPresent_.set(qid, 0);
  }

  fun restorePending(qid: Int) {
    if (!self.userByQidPresent_.exists(qid)) { return; }
    let active = self.userByQidPresent_.get(qid)!!;
    if (active == 0) { return; }
    if (!self.userByQid_.exists(qid)) { return; }
    let a = self.userByQid_.get(qid)!!;

    if (!self.isPending(a)) { return; }
    if (self.pendingQid(a) != qid) { return; }

    let total = self.pendingTotal_.get(a)!!;

    let buyerPart = self.pendingBuyer_.exists(a)    ? self.pendingBuyer_.get(a)!!    : 0;
    let refPart   = self.pendingReferral_.exists(a) ? self.pendingReferral_.get(a)!! : 0;

    if (buyerPart > 0) {
      let cur = self.claimedBuyer_.exists(a) ? self.claimedBuyer_.get(a)!! : 0;
      if (cur <= buyerPart) {
        self.claimedBuyer_.set(a, 0);
      } else {
        self.claimedBuyer_.set(a, cur - buyerPart);
      }
    }

    if (refPart > 0) {
      let cur = self.claimedRef_.exists(a) ? self.claimedRef_.get(a)!! : 0;
      if (cur <= refPart) {
        self.claimedRef_.set(a, 0);
      } else {
        self.claimedRef_.set(a, cur - refPart);
      }
    }

    if (buyerPart > 0) { self.restoreClaimableBuyer(a, buyerPart); }
    if (refPart > 0)   { self.restoreClaimableReferral(a, refPart); }

    self.safeSubPendingTotal(total);
    self.clearPending(a);

    // cleanup mapping presence (address value can remain stale but inactive)
    self.userByQidPresent_.set(qid, 0);
  }

  // -----------------------------
  // Read-only map helper (safe — does NOT write, no bug)
  // -----------------------------
  fun mapGetOr0(m: map<Address, Int>, a: Address): Int {
    return m.exists(a) ? m.get(a)!! : 0;
  }

  // -----------------------------
  // restore helpers
  // -----------------------------
  fun restoreClaimableBuyer(a: Address, amount: Int) {
    if (amount <= 0) { return; }

    let cur = self.claimableBuyer_.exists(a) ? self.claimableBuyer_.get(a)!! : 0;
    self.claimableBuyer_.set(a, cur + amount);

    self.totalClaimableNano_ = self.totalClaimableNano_ + amount;
  }

  fun restoreClaimableReferral(a: Address, amount: Int) {
    if (amount <= 0) { return; }

    let cur = self.claimableReferral_.exists(a) ? self.claimableReferral_.get(a)!! : 0;
    self.claimableReferral_.set(a, cur + amount);

    self.totalClaimableNano_ = self.totalClaimableNano_ + amount;
  }

  fun addClaimableBuyer(a: Address, amount: Int) {
    if (amount <= 0) { return; }

    let cur = self.claimableBuyer_.exists(a) ? self.claimableBuyer_.get(a)!! : 0;
    self.claimableBuyer_.set(a, cur + amount);

    self.totalClaimableNano_ = self.totalClaimableNano_ + amount;

    let curCred = self.creditedBuyer_.exists(a) ? self.creditedBuyer_.get(a)!! : 0;
    self.creditedBuyer_.set(a, curCred + amount);
  }

  fun addClaimableReferral(a: Address, amount: Int) {
    if (amount <= 0) { return; }

    let cur = self.claimableReferral_.exists(a) ? self.claimableReferral_.get(a)!! : 0;
    self.claimableReferral_.set(a, cur + amount);

    self.totalClaimableNano_ = self.totalClaimableNano_ + amount;

    let curCred = self.creditedRef_.exists(a) ? self.creditedRef_.get(a)!! : 0;
    self.creditedRef_.set(a, curCred + amount);
  }

  fun sendJettonTo(to: Address, amountNano: Int, qid: Int) {
    require(self.jettonWallet_ != null, "JETTON_WALLET_NOT_SET");
    require(amountNano > 0, "BAD_AMOUNT");
    require(qid > 0, "BAD_QID");

    let body = beginCell()
      .storeUint(self.OP_JETTON_TRANSFER, 32)
      .storeUint(qid, 64)
      .storeCoins(amountNano)
      .storeAddress(to)          // destination
      .storeAddress(myAddress()) // response_destination
      .storeMaybeRef(null)       // custom_payload
      .storeCoins(self.FORWARD_TON_TO_CLAIMER)
      .storeBit(true)            // Either: 1 = ^Cell
      .storeRef(emptyCell())     // forward_payload as ^Cell(empty)
      .endCell();

    send(SendParameters{
      to: self.jettonWallet_!!,
      value: self.JETTON_WALLET_CALL_VALUE,
      bounce: true,
      body: body
    });
  }

  fun isPresaleEnded(): Bool {
    if (self.currentRound_ < self.MAX_ROUND) { return false; }
    if (self.currentRound_ > self.MAX_ROUND) { return true; }

    let lastCap = self.roundCapNano(self.MAX_ROUND);
    return lastCap > 0 && self.currentRoundSoldNano_ >= lastCap;
  }

  // =============================
  // Rounds: caps + prices
  // =============================

  fun roundCapTokens(i: Int): Int {
    if (i == 0)  { return 65225022; }
    if (i == 1)  { return 57039669; }
    if (i == 2)  { return 50370908; }
    if (i == 3)  { return 44326399; }
    if (i == 4)  { return 39007231; }
    if (i == 5)  { return 34326365; }
    if (i == 6)  { return 30207200; }
    if (i == 7)  { return 26582336; }
    if (i == 8)  { return 23392455; }
    if (i == 9)  { return 20585361; }
    if (i == 10) { return 18115117; }
    if (i == 11) { return 15941303; }
    if (i == 12) { return 14028347; }
    if (i == 13) { return 12344945; }
    if (i == 14) { return 10863552; }
    if (i == 15) { return 9559925; }
    if (i == 16) { return 8412734; }
    if (i == 17) { return 7423267; }
    if (i == 18) { return 6514821; }
    return 5733043;
  }

  fun roundCapNano(i: Int): Int {
    return self.roundCapTokens(i) * self.NANO_JETTON;
  }

  fun roundPriceNano(i: Int): Int {
    if (i == 0)  { return 11489000; }
    if (i == 1)  { return 13443000; }
    if (i == 2)  { return 15729000; }
    if (i == 3)  { return 18403000; }
    if (i == 4)  { return 21532000; }
    if (i == 5)  { return 25191000; }
    if (i == 6)  { return 29471000; }
    if (i == 7)  { return 34483000; }
    if (i == 8)  { return 40345000; }
    if (i == 9)  { return 47206000; }
    if (i == 10) { return 55231000; }
    if (i == 11) { return 64618000; }
    if (i == 12) { return 75603000; }
    if (i == 13) { return 88455000; }
    if (i == 14) { return 103495000; }
    if (i == 15) { return 121086000; }
    if (i == 16) { return 141671000; }
    if (i == 17) { return 165757000; }
    if (i == 18) { return 193935000; }
    return 226397000;
  }
}