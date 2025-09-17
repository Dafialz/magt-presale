import {
    Cell,
    Slice,
    Address,
    Builder,
    beginCell,
    ComputeError,
    TupleItem,
    TupleReader,
    Dictionary,
    contractAddress,
    address,
    ContractProvider,
    Sender,
    Contract,
    ContractABI,
    ABIType,
    ABIGetter,
    ABIReceiver,
    TupleBuilder,
    DictionaryValue
} from '@ton/core';

export type DataSize = {
    $$type: 'DataSize';
    cells: bigint;
    bits: bigint;
    refs: bigint;
}

export function storeDataSize(src: DataSize) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.cells, 257);
        b_0.storeInt(src.bits, 257);
        b_0.storeInt(src.refs, 257);
    };
}

export function loadDataSize(slice: Slice) {
    const sc_0 = slice;
    const _cells = sc_0.loadIntBig(257);
    const _bits = sc_0.loadIntBig(257);
    const _refs = sc_0.loadIntBig(257);
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadGetterTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function storeTupleDataSize(source: DataSize) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.cells);
    builder.writeNumber(source.bits);
    builder.writeNumber(source.refs);
    return builder.build();
}

export function dictValueParserDataSize(): DictionaryValue<DataSize> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDataSize(src)).endCell());
        },
        parse: (src) => {
            return loadDataSize(src.loadRef().beginParse());
        }
    }
}

export type SignedBundle = {
    $$type: 'SignedBundle';
    signature: Buffer;
    signedData: Slice;
}

export function storeSignedBundle(src: SignedBundle) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBuffer(src.signature);
        b_0.storeBuilder(src.signedData.asBuilder());
    };
}

export function loadSignedBundle(slice: Slice) {
    const sc_0 = slice;
    const _signature = sc_0.loadBuffer(64);
    const _signedData = sc_0;
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadGetterTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function storeTupleSignedBundle(source: SignedBundle) {
    const builder = new TupleBuilder();
    builder.writeBuffer(source.signature);
    builder.writeSlice(source.signedData.asCell());
    return builder.build();
}

export function dictValueParserSignedBundle(): DictionaryValue<SignedBundle> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSignedBundle(src)).endCell());
        },
        parse: (src) => {
            return loadSignedBundle(src.loadRef().beginParse());
        }
    }
}

export type StateInit = {
    $$type: 'StateInit';
    code: Cell;
    data: Cell;
}

export function storeStateInit(src: StateInit) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeRef(src.code);
        b_0.storeRef(src.data);
    };
}

export function loadStateInit(slice: Slice) {
    const sc_0 = slice;
    const _code = sc_0.loadRef();
    const _data = sc_0.loadRef();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadGetterTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function storeTupleStateInit(source: StateInit) {
    const builder = new TupleBuilder();
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    return builder.build();
}

export function dictValueParserStateInit(): DictionaryValue<StateInit> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStateInit(src)).endCell());
        },
        parse: (src) => {
            return loadStateInit(src.loadRef().beginParse());
        }
    }
}

export type Context = {
    $$type: 'Context';
    bounceable: boolean;
    sender: Address;
    value: bigint;
    raw: Slice;
}

export function storeContext(src: Context) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBit(src.bounceable);
        b_0.storeAddress(src.sender);
        b_0.storeInt(src.value, 257);
        b_0.storeRef(src.raw.asCell());
    };
}

export function loadContext(slice: Slice) {
    const sc_0 = slice;
    const _bounceable = sc_0.loadBit();
    const _sender = sc_0.loadAddress();
    const _value = sc_0.loadIntBig(257);
    const _raw = sc_0.loadRef().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadGetterTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function storeTupleContext(source: Context) {
    const builder = new TupleBuilder();
    builder.writeBoolean(source.bounceable);
    builder.writeAddress(source.sender);
    builder.writeNumber(source.value);
    builder.writeSlice(source.raw.asCell());
    return builder.build();
}

export function dictValueParserContext(): DictionaryValue<Context> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeContext(src)).endCell());
        },
        parse: (src) => {
            return loadContext(src.loadRef().beginParse());
        }
    }
}

export type SendParameters = {
    $$type: 'SendParameters';
    mode: bigint;
    body: Cell | null;
    code: Cell | null;
    data: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeSendParameters(src: SendParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        if (src.code !== null && src.code !== undefined) { b_0.storeBit(true).storeRef(src.code); } else { b_0.storeBit(false); }
        if (src.data !== null && src.data !== undefined) { b_0.storeBit(true).storeRef(src.data); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadSendParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _code = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _data = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleSendParameters(source: SendParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserSendParameters(): DictionaryValue<SendParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSendParameters(src)).endCell());
        },
        parse: (src) => {
            return loadSendParameters(src.loadRef().beginParse());
        }
    }
}

export type MessageParameters = {
    $$type: 'MessageParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeMessageParameters(src: MessageParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadMessageParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleMessageParameters(source: MessageParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserMessageParameters(): DictionaryValue<MessageParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeMessageParameters(src)).endCell());
        },
        parse: (src) => {
            return loadMessageParameters(src.loadRef().beginParse());
        }
    }
}

export type DeployParameters = {
    $$type: 'DeployParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    bounce: boolean;
    init: StateInit;
}

export function storeDeployParameters(src: DeployParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeBit(src.bounce);
        b_0.store(storeStateInit(src.init));
    };
}

export function loadDeployParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _bounce = sc_0.loadBit();
    const _init = loadStateInit(sc_0);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadGetterTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadGetterTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function storeTupleDeployParameters(source: DeployParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeBoolean(source.bounce);
    builder.writeTuple(storeTupleStateInit(source.init));
    return builder.build();
}

export function dictValueParserDeployParameters(): DictionaryValue<DeployParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployParameters(src)).endCell());
        },
        parse: (src) => {
            return loadDeployParameters(src.loadRef().beginParse());
        }
    }
}

export type StdAddress = {
    $$type: 'StdAddress';
    workchain: bigint;
    address: bigint;
}

export function storeStdAddress(src: StdAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 8);
        b_0.storeUint(src.address, 256);
    };
}

export function loadStdAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(8);
    const _address = sc_0.loadUintBig(256);
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleStdAddress(source: StdAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeNumber(source.address);
    return builder.build();
}

export function dictValueParserStdAddress(): DictionaryValue<StdAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStdAddress(src)).endCell());
        },
        parse: (src) => {
            return loadStdAddress(src.loadRef().beginParse());
        }
    }
}

export type VarAddress = {
    $$type: 'VarAddress';
    workchain: bigint;
    address: Slice;
}

export function storeVarAddress(src: VarAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 32);
        b_0.storeRef(src.address.asCell());
    };
}

export function loadVarAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(32);
    const _address = sc_0.loadRef().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleVarAddress(source: VarAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeSlice(source.address.asCell());
    return builder.build();
}

export function dictValueParserVarAddress(): DictionaryValue<VarAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeVarAddress(src)).endCell());
        },
        parse: (src) => {
            return loadVarAddress(src.loadRef().beginParse());
        }
    }
}

export type BasechainAddress = {
    $$type: 'BasechainAddress';
    hash: bigint | null;
}

export function storeBasechainAddress(src: BasechainAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        if (src.hash !== null && src.hash !== undefined) { b_0.storeBit(true).storeInt(src.hash, 257); } else { b_0.storeBit(false); }
    };
}

export function loadBasechainAddress(slice: Slice) {
    const sc_0 = slice;
    const _hash = sc_0.loadBit() ? sc_0.loadIntBig(257) : null;
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadGetterTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function storeTupleBasechainAddress(source: BasechainAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.hash);
    return builder.build();
}

export function dictValueParserBasechainAddress(): DictionaryValue<BasechainAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBasechainAddress(src)).endCell());
        },
        parse: (src) => {
            return loadBasechainAddress(src.loadRef().beginParse());
        }
    }
}

export type Deploy = {
    $$type: 'Deploy';
    queryId: bigint;
}

export function storeDeploy(src: Deploy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2490013878, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadDeploy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2490013878) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function loadTupleDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function loadGetterTupleDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function storeTupleDeploy(source: Deploy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserDeploy(): DictionaryValue<Deploy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeploy(src)).endCell());
        },
        parse: (src) => {
            return loadDeploy(src.loadRef().beginParse());
        }
    }
}

export type DeployOk = {
    $$type: 'DeployOk';
    queryId: bigint;
}

export function storeDeployOk(src: DeployOk) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2952335191, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadDeployOk(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2952335191) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function loadTupleDeployOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function loadGetterTupleDeployOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function storeTupleDeployOk(source: DeployOk) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserDeployOk(): DictionaryValue<DeployOk> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployOk(src)).endCell());
        },
        parse: (src) => {
            return loadDeployOk(src.loadRef().beginParse());
        }
    }
}

export type FactoryDeploy = {
    $$type: 'FactoryDeploy';
    queryId: bigint;
    cashback: Address;
}

export function storeFactoryDeploy(src: FactoryDeploy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1829761339, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.cashback);
    };
}

export function loadFactoryDeploy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1829761339) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _cashback = sc_0.loadAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function loadTupleFactoryDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _cashback = source.readAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function loadGetterTupleFactoryDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _cashback = source.readAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function storeTupleFactoryDeploy(source: FactoryDeploy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.cashback);
    return builder.build();
}

export function dictValueParserFactoryDeploy(): DictionaryValue<FactoryDeploy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeFactoryDeploy(src)).endCell());
        },
        parse: (src) => {
            return loadFactoryDeploy(src.loadRef().beginParse());
        }
    }
}

export type Level = {
    $$type: 'Level';
    tokens: bigint;
    price: bigint;
}

export function storeLevel(src: Level) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.tokens, 257);
        b_0.storeInt(src.price, 257);
    };
}

export function loadLevel(slice: Slice) {
    const sc_0 = slice;
    const _tokens = sc_0.loadIntBig(257);
    const _price = sc_0.loadIntBig(257);
    return { $$type: 'Level' as const, tokens: _tokens, price: _price };
}

export function loadTupleLevel(source: TupleReader) {
    const _tokens = source.readBigNumber();
    const _price = source.readBigNumber();
    return { $$type: 'Level' as const, tokens: _tokens, price: _price };
}

export function loadGetterTupleLevel(source: TupleReader) {
    const _tokens = source.readBigNumber();
    const _price = source.readBigNumber();
    return { $$type: 'Level' as const, tokens: _tokens, price: _price };
}

export function storeTupleLevel(source: Level) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.tokens);
    builder.writeNumber(source.price);
    return builder.build();
}

export function dictValueParserLevel(): DictionaryValue<Level> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeLevel(src)).endCell());
        },
        parse: (src) => {
            return loadLevel(src.loadRef().beginParse());
        }
    }
}

export type LevelInfo = {
    $$type: 'LevelInfo';
    level: bigint;
    remaining: bigint;
    totalSold: bigint;
}

export function storeLevelInfo(src: LevelInfo) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.level, 257);
        b_0.storeInt(src.remaining, 257);
        b_0.storeInt(src.totalSold, 257);
    };
}

export function loadLevelInfo(slice: Slice) {
    const sc_0 = slice;
    const _level = sc_0.loadIntBig(257);
    const _remaining = sc_0.loadIntBig(257);
    const _totalSold = sc_0.loadIntBig(257);
    return { $$type: 'LevelInfo' as const, level: _level, remaining: _remaining, totalSold: _totalSold };
}

export function loadTupleLevelInfo(source: TupleReader) {
    const _level = source.readBigNumber();
    const _remaining = source.readBigNumber();
    const _totalSold = source.readBigNumber();
    return { $$type: 'LevelInfo' as const, level: _level, remaining: _remaining, totalSold: _totalSold };
}

export function loadGetterTupleLevelInfo(source: TupleReader) {
    const _level = source.readBigNumber();
    const _remaining = source.readBigNumber();
    const _totalSold = source.readBigNumber();
    return { $$type: 'LevelInfo' as const, level: _level, remaining: _remaining, totalSold: _totalSold };
}

export function storeTupleLevelInfo(source: LevelInfo) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.level);
    builder.writeNumber(source.remaining);
    builder.writeNumber(source.totalSold);
    return builder.build();
}

export function dictValueParserLevelInfo(): DictionaryValue<LevelInfo> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeLevelInfo(src)).endCell());
        },
        parse: (src) => {
            return loadLevelInfo(src.loadRef().beginParse());
        }
    }
}

export type RefQuery = {
    $$type: 'RefQuery';
    exists: boolean;
    ref: Address | null;
}

export function storeRefQuery(src: RefQuery) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBit(src.exists);
        b_0.storeAddress(src.ref);
    };
}

export function loadRefQuery(slice: Slice) {
    const sc_0 = slice;
    const _exists = sc_0.loadBit();
    const _ref = sc_0.loadMaybeAddress();
    return { $$type: 'RefQuery' as const, exists: _exists, ref: _ref };
}

export function loadTupleRefQuery(source: TupleReader) {
    const _exists = source.readBoolean();
    const _ref = source.readAddressOpt();
    return { $$type: 'RefQuery' as const, exists: _exists, ref: _ref };
}

export function loadGetterTupleRefQuery(source: TupleReader) {
    const _exists = source.readBoolean();
    const _ref = source.readAddressOpt();
    return { $$type: 'RefQuery' as const, exists: _exists, ref: _ref };
}

export function storeTupleRefQuery(source: RefQuery) {
    const builder = new TupleBuilder();
    builder.writeBoolean(source.exists);
    builder.writeAddress(source.ref);
    return builder.build();
}

export function dictValueParserRefQuery(): DictionaryValue<RefQuery> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeRefQuery(src)).endCell());
        },
        parse: (src) => {
            return loadRefQuery(src.loadRef().beginParse());
        }
    }
}

export type MAGTSale$Data = {
    $$type: 'MAGTSale$Data';
    owner: Address;
    magtMinter: Address;
    saleJW: Address;
    magtDecimals: bigint;
    levels: Dictionary<bigint, Level>;
    currentLevel: bigint;
    remainingInLevel: bigint;
    totalSoldHuman: bigint;
    refPoolLeftHuman: bigint;
    refOf: Dictionary<Address, Address>;
}

export function storeMAGTSale$Data(src: MAGTSale$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.magtMinter);
        b_0.storeAddress(src.saleJW);
        const b_1 = new Builder();
        b_1.storeInt(src.magtDecimals, 257);
        b_1.storeDict(src.levels, Dictionary.Keys.BigInt(257), dictValueParserLevel());
        b_1.storeInt(src.currentLevel, 257);
        b_1.storeInt(src.remainingInLevel, 257);
        const b_2 = new Builder();
        b_2.storeInt(src.totalSoldHuman, 257);
        b_2.storeInt(src.refPoolLeftHuman, 257);
        b_2.storeDict(src.refOf, Dictionary.Keys.Address(), Dictionary.Values.Address());
        b_1.storeRef(b_2.endCell());
        b_0.storeRef(b_1.endCell());
    };
}

export function loadMAGTSale$Data(slice: Slice) {
    const sc_0 = slice;
    const _owner = sc_0.loadAddress();
    const _magtMinter = sc_0.loadAddress();
    const _saleJW = sc_0.loadAddress();
    const sc_1 = sc_0.loadRef().beginParse();
    const _magtDecimals = sc_1.loadIntBig(257);
    const _levels = Dictionary.load(Dictionary.Keys.BigInt(257), dictValueParserLevel(), sc_1);
    const _currentLevel = sc_1.loadIntBig(257);
    const _remainingInLevel = sc_1.loadIntBig(257);
    const sc_2 = sc_1.loadRef().beginParse();
    const _totalSoldHuman = sc_2.loadIntBig(257);
    const _refPoolLeftHuman = sc_2.loadIntBig(257);
    const _refOf = Dictionary.load(Dictionary.Keys.Address(), Dictionary.Values.Address(), sc_2);
    return { $$type: 'MAGTSale$Data' as const, owner: _owner, magtMinter: _magtMinter, saleJW: _saleJW, magtDecimals: _magtDecimals, levels: _levels, currentLevel: _currentLevel, remainingInLevel: _remainingInLevel, totalSoldHuman: _totalSoldHuman, refPoolLeftHuman: _refPoolLeftHuman, refOf: _refOf };
}

export function loadTupleMAGTSale$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _magtMinter = source.readAddress();
    const _saleJW = source.readAddress();
    const _magtDecimals = source.readBigNumber();
    const _levels = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), dictValueParserLevel(), source.readCellOpt());
    const _currentLevel = source.readBigNumber();
    const _remainingInLevel = source.readBigNumber();
    const _totalSoldHuman = source.readBigNumber();
    const _refPoolLeftHuman = source.readBigNumber();
    const _refOf = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.Address(), source.readCellOpt());
    return { $$type: 'MAGTSale$Data' as const, owner: _owner, magtMinter: _magtMinter, saleJW: _saleJW, magtDecimals: _magtDecimals, levels: _levels, currentLevel: _currentLevel, remainingInLevel: _remainingInLevel, totalSoldHuman: _totalSoldHuman, refPoolLeftHuman: _refPoolLeftHuman, refOf: _refOf };
}

export function loadGetterTupleMAGTSale$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _magtMinter = source.readAddress();
    const _saleJW = source.readAddress();
    const _magtDecimals = source.readBigNumber();
    const _levels = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), dictValueParserLevel(), source.readCellOpt());
    const _currentLevel = source.readBigNumber();
    const _remainingInLevel = source.readBigNumber();
    const _totalSoldHuman = source.readBigNumber();
    const _refPoolLeftHuman = source.readBigNumber();
    const _refOf = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.Address(), source.readCellOpt());
    return { $$type: 'MAGTSale$Data' as const, owner: _owner, magtMinter: _magtMinter, saleJW: _saleJW, magtDecimals: _magtDecimals, levels: _levels, currentLevel: _currentLevel, remainingInLevel: _remainingInLevel, totalSoldHuman: _totalSoldHuman, refPoolLeftHuman: _refPoolLeftHuman, refOf: _refOf };
}

export function storeTupleMAGTSale$Data(source: MAGTSale$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.owner);
    builder.writeAddress(source.magtMinter);
    builder.writeAddress(source.saleJW);
    builder.writeNumber(source.magtDecimals);
    builder.writeCell(source.levels.size > 0 ? beginCell().storeDictDirect(source.levels, Dictionary.Keys.BigInt(257), dictValueParserLevel()).endCell() : null);
    builder.writeNumber(source.currentLevel);
    builder.writeNumber(source.remainingInLevel);
    builder.writeNumber(source.totalSoldHuman);
    builder.writeNumber(source.refPoolLeftHuman);
    builder.writeCell(source.refOf.size > 0 ? beginCell().storeDictDirect(source.refOf, Dictionary.Keys.Address(), Dictionary.Values.Address()).endCell() : null);
    return builder.build();
}

export function dictValueParserMAGTSale$Data(): DictionaryValue<MAGTSale$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeMAGTSale$Data(src)).endCell());
        },
        parse: (src) => {
            return loadMAGTSale$Data(src.loadRef().beginParse());
        }
    }
}

 type MAGTSale_init_args = {
    $$type: 'MAGTSale_init_args';
    owner: Address;
    magtMinter: Address;
    saleJW: Address;
    magtDecimals: bigint;
    levelsInit: Dictionary<bigint, Level>;
    startLevel: bigint;
    startRemaining: bigint;
    refPoolHuman: bigint;
}

function initMAGTSale_init_args(src: MAGTSale_init_args) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.magtMinter);
        b_0.storeAddress(src.saleJW);
        const b_1 = new Builder();
        b_1.storeInt(src.magtDecimals, 257);
        b_1.storeDict(src.levelsInit, Dictionary.Keys.BigInt(257), dictValueParserLevel());
        b_1.storeInt(src.startLevel, 257);
        b_1.storeInt(src.startRemaining, 257);
        const b_2 = new Builder();
        b_2.storeInt(src.refPoolHuman, 257);
        b_1.storeRef(b_2.endCell());
        b_0.storeRef(b_1.endCell());
    };
}

async function MAGTSale_init(owner: Address, magtMinter: Address, saleJW: Address, magtDecimals: bigint, levelsInit: Dictionary<bigint, Level>, startLevel: bigint, startRemaining: bigint, refPoolHuman: bigint) {
    const __code = Cell.fromHex('b5ee9c72410226010008e5000262ff008e88f4a413f4bcf2c80bed53208e9c30eda2edfb01d072d721d200d200fa4021103450666f04f86102f862e1ed43d9010c020271020a020166030501e7b0827b5134348000638cbe903e903e9035007420404075c03d0120404075c020404075c0350c3420404075c020404075c03d010c041e841e441e1b06a38c3e903e903e9035007420404075c03d0120404075c020404075c0350c3420404075c00c04160415c415823455419b5c1678b6cf1b286004000221020274060801e5a217b5134348000638cbe903e903e9035007420404075c03d0120404075c020404075c0350c3420404075c020404075c03d010c041e841e441e1b06a38c3e903e903e9035007420404075c03d0120404075c020404075c0350c3420404075c00c04160415c415823455419b5c1678b6cf1b28e07000654743201e5a297b5134348000638cbe903e903e9035007420404075c03d0120404075c020404075c0350c3420404075c020404075c03d010c041e841e441e1b06a38c3e903e903e9035007420404075c03d0120404075c020404075c0350c3420404075c00c04160415c415823455419b5c1678b6cf1b2860900022901ebbca6bf6a268690000c7197d207d207d206a00e8408080eb807a02408080eb80408080eb806a1868408080eb80408080eb807a0218083d083c883c360d47187d207d207d206a00e8408080eb807a02408080eb80408080eb806a1868408080eb8018082c082b882b0468aa8336b82cf12a84ed9e365140b00422181010b2259f40a6fa1318e107f81010b54431359f40a6fa192306ddfe030706d01feed44d0d200018e32fa40fa40fa40d401d0810101d700f404810101d700810101d700d430d0810101d700810101d700f40430107a107910786c1a8e30fa40fa40fa40d401d0810101d700f404810101d700810101d700d430d0810101d7003010581057105608d155066d7059e20b925f0be0702ad749c21f953029d70b1fde0d04e88210946a98b6ba8ec8098020d721d33f30c8018210aff90f5758cb1fcb3fc9108a10791068105710461035443012f84270705003804201503304c8cf8580ca00cf8440ce01fa02806acf40f400c901fb00e0f8422ad749c21fe3002ad749e300f8416f24135f03811bd621c200f2f42bd749c2000e0f11140072c87f01ca005590509ace17ce15ce03c8810101cf0012f400810101cf0012810101cf0002c8810101cf0013810101cf0013f40012cdcdc9ed5402ec2ad70b1f1a191817506c15144330db3c1dba8edf0ad31f31fa00308200bb7551a9c7051af2f4270b107a106910581047103640550403db3cc87f01ca005590509ace17ce15ce03c8810101cf0012f400810101cf0012810101cf0002c8810101cf0013810101cf0013f40012cdcdc9ed54db31e055081025000681777702c02ad749c1208e41303910795516c87f01ca005590509ace17ce15ce03c8810101cf0012f400810101cf0012810101cf0002c8810101cf0013810101cf0013f40012cdcdc9ed54db31e00ad31f1a191817506c15144330db3c1bbde302109b55091213000c8210b0a1cafe007e3a3a5526c87f01ca005590509ace17ce15ce03c8810101cf0012f400810101cf0012810101cf0002c8810101cf0013810101cf0013f40012cdcdc9ed54db3103fc8e480bd200019720d74981010bbe9170e28e34fa40302c81010b2359f40a6fa131b3955301c705b39170e28e171c81010b52d2206e953059f4593096c8ce4133f441e20b9130e29130e2913be22b81010b2259f40a6fa1319321c2009170e22091719170e2a4109b5e37106a105b104a103b4abddb3c1ea80ddb3c500ea0211516000a8208989680049c8200ab8053d1bef2f451dcdb3c8200921921c200f2f4209320c2008ae8305133a0700d8e9b23a7058064a90420c2008e8c3d52240ddb3c5122a1401c039130e2de2710ab109b108b07060504433b171a1b1c01487053658e1923c2009b298101012359f40c6fa1319170e29320c2009170e28ae810235f031801cc298101012359f40d6fa192306ddf206e92306d8e10d0810101d700810101d700596c126f02e2817615216eb3f2f4206ef2d0806f22315340a90420c2008e125f03104c103b509a70091058104745644013e30d108d107c106b105a10491038476010354413021901e210af109e108d107c106b105f104e103d4cb052c0db3c51eea051cea150eba81ea1298e4c390aa4238101012259f40c6fa1318e37238101012259f40d6fa192306ddf206e92306d8e10d0810101d700810101d700596c126f02e28200cffe216eb3f2f4206ef2d0806f22309170e250b9df1b00dc2681458b298101012359f40c6fa131f2f45316bb943015a1708e51375005a105a4268101012259f40c6fa1318e36268101012259f40d6fa192306ddf206e92306d8e10d0810101d700810101d700596c126f02e2814b4c216eb3f2f4206ef2d0806f22309435705155e25006e215000c5cb99130e03104f0db3c51bba850dba82710ab090a1078106710561045103443d054120cdb3c2bc2009b2081010b2c59f40a6fa1319170e28eb081010b54411c59f40a6fa192306ddf206eb3f2e4da206ef2d0802710ac109b0a107910681057104610354400db3c5571923a3ae20a700ca1107b106a105910481037465044301d1e1e23001e7170935302b99501a70a01a4e8303104f6c8c97f6dc809111009108f107e106d105c104b103a0211100250fedb3c500fcb1f7001cb3f1ccb7f500acf16f828cf161df4001069105810471036454b1c13db3c1cfa021dca001bcc1079106810571046103544304abbdb3c7f710ec9104d41301e146d50436d5033c8cf8580ca00cf8440ce01fa028069cf40021f202122000c82100f8a7ea5000a8209c9c380000c821005f5e10000445c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0010795516028edb3c20c2008e8452a0db3c9130e2c87f01ca005590509ace17ce15ce03c8810101cf0012f400810101cf0012810101cf0002c8810101cf0013810101cf0013f40012cdcdc9ed542425000c5cbc9130e03100747070036d6d50436d5033c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0045b7872d');
    const builder = beginCell();
    builder.storeUint(0, 1);
    initMAGTSale_init_args({ $$type: 'MAGTSale_init_args', owner, magtMinter, saleJW, magtDecimals, levelsInit, startLevel, startRemaining, refPoolHuman })(builder);
    const __data = builder.endCell();
    return { code: __code, data: __data };
}

export const MAGTSale_errors = {
    2: { message: "Stack underflow" },
    3: { message: "Stack overflow" },
    4: { message: "Integer overflow" },
    5: { message: "Integer out of expected range" },
    6: { message: "Invalid opcode" },
    7: { message: "Type check error" },
    8: { message: "Cell overflow" },
    9: { message: "Cell underflow" },
    10: { message: "Dictionary error" },
    11: { message: "'Unknown' error" },
    12: { message: "Fatal error" },
    13: { message: "Out of gas error" },
    14: { message: "Virtualization error" },
    32: { message: "Action list is invalid" },
    33: { message: "Action list is too long" },
    34: { message: "Action is invalid or not supported" },
    35: { message: "Invalid source address in outbound message" },
    36: { message: "Invalid destination address in outbound message" },
    37: { message: "Not enough Toncoin" },
    38: { message: "Not enough extra currencies" },
    39: { message: "Outbound message does not fit into a cell after rewriting" },
    40: { message: "Cannot process a message" },
    41: { message: "Library reference is null" },
    42: { message: "Library change action error" },
    43: { message: "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree" },
    50: { message: "Account state size exceeded limits" },
    128: { message: "Null reference exception" },
    129: { message: "Invalid serialization prefix" },
    130: { message: "Invalid incoming message" },
    131: { message: "Constraints error" },
    132: { message: "Access denied" },
    133: { message: "Contract stopped" },
    134: { message: "Invalid argument" },
    135: { message: "Code of a contract was not found" },
    136: { message: "Invalid standard address" },
    138: { message: "Not a basechain address" },
    1242: { message: "REF_NOT_SET" },
    7126: { message: "NO_TON" },
    17803: { message: "LEVEL_OOB" },
    19276: { message: "LEVEL_MISSING" },
    30229: { message: "LEVEL_NULL" },
    37401: { message: "ZERO_OUTPUT" },
    43904: { message: "LOW_PAYMENT" },
    47989: { message: "NOT_OWNER" },
    53246: { message: "LEVEL_NULL_2" },
} as const

export const MAGTSale_errors_backward = {
    "Stack underflow": 2,
    "Stack overflow": 3,
    "Integer overflow": 4,
    "Integer out of expected range": 5,
    "Invalid opcode": 6,
    "Type check error": 7,
    "Cell overflow": 8,
    "Cell underflow": 9,
    "Dictionary error": 10,
    "'Unknown' error": 11,
    "Fatal error": 12,
    "Out of gas error": 13,
    "Virtualization error": 14,
    "Action list is invalid": 32,
    "Action list is too long": 33,
    "Action is invalid or not supported": 34,
    "Invalid source address in outbound message": 35,
    "Invalid destination address in outbound message": 36,
    "Not enough Toncoin": 37,
    "Not enough extra currencies": 38,
    "Outbound message does not fit into a cell after rewriting": 39,
    "Cannot process a message": 40,
    "Library reference is null": 41,
    "Library change action error": 42,
    "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree": 43,
    "Account state size exceeded limits": 50,
    "Null reference exception": 128,
    "Invalid serialization prefix": 129,
    "Invalid incoming message": 130,
    "Constraints error": 131,
    "Access denied": 132,
    "Contract stopped": 133,
    "Invalid argument": 134,
    "Code of a contract was not found": 135,
    "Invalid standard address": 136,
    "Not a basechain address": 138,
    "REF_NOT_SET": 1242,
    "NO_TON": 7126,
    "LEVEL_OOB": 17803,
    "LEVEL_MISSING": 19276,
    "LEVEL_NULL": 30229,
    "ZERO_OUTPUT": 37401,
    "LOW_PAYMENT": 43904,
    "NOT_OWNER": 47989,
    "LEVEL_NULL_2": 53246,
} as const

const MAGTSale_types: ABIType[] = [
    {"name":"DataSize","header":null,"fields":[{"name":"cells","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bits","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"refs","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"SignedBundle","header":null,"fields":[{"name":"signature","type":{"kind":"simple","type":"fixed-bytes","optional":false,"format":64}},{"name":"signedData","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"StateInit","header":null,"fields":[{"name":"code","type":{"kind":"simple","type":"cell","optional":false}},{"name":"data","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"Context","header":null,"fields":[{"name":"bounceable","type":{"kind":"simple","type":"bool","optional":false}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"raw","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"SendParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"code","type":{"kind":"simple","type":"cell","optional":true}},{"name":"data","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"MessageParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"DeployParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}},{"name":"init","type":{"kind":"simple","type":"StateInit","optional":false}}]},
    {"name":"StdAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":8}},{"name":"address","type":{"kind":"simple","type":"uint","optional":false,"format":256}}]},
    {"name":"VarAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":32}},{"name":"address","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"BasechainAddress","header":null,"fields":[{"name":"hash","type":{"kind":"simple","type":"int","optional":true,"format":257}}]},
    {"name":"Deploy","header":2490013878,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"DeployOk","header":2952335191,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"FactoryDeploy","header":1829761339,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"cashback","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"Level","header":null,"fields":[{"name":"tokens","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"price","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"LevelInfo","header":null,"fields":[{"name":"level","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"remaining","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"totalSold","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"RefQuery","header":null,"fields":[{"name":"exists","type":{"kind":"simple","type":"bool","optional":false}},{"name":"ref","type":{"kind":"simple","type":"address","optional":true}}]},
    {"name":"MAGTSale$Data","header":null,"fields":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"magtMinter","type":{"kind":"simple","type":"address","optional":false}},{"name":"saleJW","type":{"kind":"simple","type":"address","optional":false}},{"name":"magtDecimals","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"levels","type":{"kind":"dict","key":"int","value":"Level","valueFormat":"ref"}},{"name":"currentLevel","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"remainingInLevel","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"totalSoldHuman","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"refPoolLeftHuman","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"refOf","type":{"kind":"dict","key":"address","value":"address"}}]},
]

const MAGTSale_opcodes = {
    "Deploy": 2490013878,
    "DeployOk": 2952335191,
    "FactoryDeploy": 1829761339,
}

const MAGTSale_getters: ABIGetter[] = [
    {"name":"get_owner","methodId":80293,"arguments":[],"returnType":{"kind":"simple","type":"address","optional":false}},
    {"name":"get_level","methodId":80005,"arguments":[],"returnType":{"kind":"simple","type":"LevelInfo","optional":false}},
    {"name":"get_ref_pool_left","methodId":74249,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"get_referrer","methodId":103639,"arguments":[{"name":"addr","type":{"kind":"simple","type":"address","optional":false}}],"returnType":{"kind":"simple","type":"RefQuery","optional":false}},
]

export const MAGTSale_getterMapping: { [key: string]: string } = {
    'get_owner': 'getGetOwner',
    'get_level': 'getGetLevel',
    'get_ref_pool_left': 'getGetRefPoolLeft',
    'get_referrer': 'getGetReferrer',
}

const MAGTSale_receivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"any"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Deploy"}},
]


export class MAGTSale implements Contract {
    
    public static readonly storageReserve = 0n;
    public static readonly errors = MAGTSale_errors_backward;
    public static readonly opcodes = MAGTSale_opcodes;
    
    static async init(owner: Address, magtMinter: Address, saleJW: Address, magtDecimals: bigint, levelsInit: Dictionary<bigint, Level>, startLevel: bigint, startRemaining: bigint, refPoolHuman: bigint) {
        return await MAGTSale_init(owner, magtMinter, saleJW, magtDecimals, levelsInit, startLevel, startRemaining, refPoolHuman);
    }
    
    static async fromInit(owner: Address, magtMinter: Address, saleJW: Address, magtDecimals: bigint, levelsInit: Dictionary<bigint, Level>, startLevel: bigint, startRemaining: bigint, refPoolHuman: bigint) {
        const __gen_init = await MAGTSale_init(owner, magtMinter, saleJW, magtDecimals, levelsInit, startLevel, startRemaining, refPoolHuman);
        const address = contractAddress(0, __gen_init);
        return new MAGTSale(address, __gen_init);
    }
    
    static fromAddress(address: Address) {
        return new MAGTSale(address);
    }
    
    readonly address: Address; 
    readonly init?: { code: Cell, data: Cell };
    readonly abi: ContractABI = {
        types:  MAGTSale_types,
        getters: MAGTSale_getters,
        receivers: MAGTSale_receivers,
        errors: MAGTSale_errors,
    };
    
    constructor(address: Address, init?: { code: Cell, data: Cell }) {
        this.address = address;
        this.init = init;
    }
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: Slice | Deploy) {
        
        let body: Cell | null = null;
        if (message && typeof message === 'object' && message instanceof Slice) {
            body = message.asCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Deploy') {
            body = beginCell().store(storeDeploy(message)).endCell();
        }
        if (body === null) { throw new Error('Invalid message type'); }
        
        await provider.internal(via, { ...args, body: body });
        
    }
    
    async getGetOwner(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('get_owner', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
    
    async getGetLevel(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('get_level', builder.build())).stack;
        const result = loadGetterTupleLevelInfo(source);
        return result;
    }
    
    async getGetRefPoolLeft(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('get_ref_pool_left', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getGetReferrer(provider: ContractProvider, addr: Address) {
        const builder = new TupleBuilder();
        builder.writeAddress(addr);
        const source = (await provider.get('get_referrer', builder.build())).stack;
        const result = loadGetterTupleRefQuery(source);
        return result;
    }
    
}