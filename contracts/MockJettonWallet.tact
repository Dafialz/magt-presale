import "@stdlib/deploy";

message SetAutoCallbacks {
  notify: Int;
  excess: Int;
}

message FundJettons {
  amount: Int;
}

message FlushLastCallbacks {}

contract MockJettonWallet with Deployable {
  controller_: Address;
  autoNotify_: Int;
  autoExcess_: Int;
  availableJettonsNano_: Int;

  lastQid_: Int;
  lastAmountNano_: Int;
  lastResponseDestination_: Address?;

  const OP_JETTON_TRANSFER: Int = 0x0f8a7ea5;
  const OP_JETTON_TRANSFER_NOTIFICATION: Int = 0x7362d09c;
  const OP_JETTON_EXCESSES: Int = 0xd53276db;

  init(controller: Address) {
    self.controller_ = controller;
    self.autoNotify_ = 1;
    self.autoExcess_ = 1;
    self.availableJettonsNano_ = 0;
    self.lastQid_ = 0;
    self.lastAmountNano_ = 0;
    self.lastResponseDestination_ = null;
  }

  receive(msg: SetAutoCallbacks) {
    require(sender() == self.controller_, "NOT_CONTROLLER");
    self.autoNotify_ = (msg.notify != 0) ? 1 : 0;
    self.autoExcess_ = (msg.excess != 0) ? 1 : 0;
  }

  receive(msg: FundJettons) {
    require(sender() == self.controller_, "NOT_CONTROLLER");
    require(msg.amount > 0, "BAD_AMOUNT");
    self.availableJettonsNano_ = self.availableJettonsNano_ + msg.amount;
  }

  receive(msg: FlushLastCallbacks) {
    require(sender() == self.controller_, "NOT_CONTROLLER");
    self.emitLastCallbacks();
  }

  receive(inMsg: Slice) {
    if (inMsg.bits() < (32 + 64)) { return; }

    let op = inMsg.loadUint(32);
    if (op != self.OP_JETTON_TRANSFER) { return; }

    let qid = inMsg.loadUint(64);
    let amountNano = inMsg.loadCoins();
    let _destination = inMsg.loadAddress();
    let responseDestination = inMsg.loadAddress();

    let hasCustomPayload = inMsg.loadBit();
    if (hasCustomPayload) {
      if (inMsg.refs() > 0) {
        let _customPayload = inMsg.loadRef();
      } else {
        return;
      }
    }

    let _forwardTon = inMsg.loadCoins();
    let isForwardRef = inMsg.loadBit();
    if (isForwardRef) {
      if (inMsg.refs() > 0) {
        let _forwardPayload = inMsg.loadRef();
      } else {
        return;
      }
    }

    if (self.availableJettonsNano_ < amountNano) { return; }
    self.availableJettonsNano_ = self.availableJettonsNano_ - amountNano;

    self.lastQid_ = qid;
    self.lastAmountNano_ = amountNano;
    self.lastResponseDestination_ = responseDestination;

    self.emitLastCallbacks();
  }

  fun emitLastCallbacks() {
    if (self.lastQid_ <= 0 || self.lastAmountNano_ <= 0 || self.lastResponseDestination_ == null) { return; }

    let to = self.lastResponseDestination_!!;
    let qid = self.lastQid_;
    let amountNano = self.lastAmountNano_;

    if (self.autoNotify_ != 0) {
      let notifyBody = beginCell()
        .storeUint(self.OP_JETTON_TRANSFER_NOTIFICATION, 32)
        .storeUint(qid, 64)
        .storeCoins(amountNano)
        .storeAddress(myAddress())
        .storeRef(emptyCell())
        .endCell();

      send(SendParameters{
        to: to,
        value: 100000000, // 0.10 TON
        bounce: false,
        body: notifyBody
      });
    }

    if (self.autoExcess_ != 0) {
      let excessBody = beginCell()
        .storeUint(self.OP_JETTON_EXCESSES, 32)
        .storeUint(qid, 64)
        .endCell();

      send(SendParameters{
        to: to,
        value: 50000000, // 0.05 TON
        bounce: false,
        body: excessBody
      });
    }
  }

  get fun availableJettonsNanoGetter(): Int {
    return self.availableJettonsNano_;
  }

  get fun lastQidGetter(): Int {
    return self.lastQid_;
  }
}
