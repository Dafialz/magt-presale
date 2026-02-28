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

export type Claim = {
    $$type: 'Claim';
    query_id: bigint;
}

export function storeClaim(src: Claim) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1129070921, 32);
        b_0.storeUint(src.query_id, 64);
    };
}

export function loadClaim(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1129070921) { throw Error('Invalid prefix'); }
    const _query_id = sc_0.loadUintBig(64);
    return { $$type: 'Claim' as const, query_id: _query_id };
}

export function loadTupleClaim(source: TupleReader) {
    const _query_id = source.readBigNumber();
    return { $$type: 'Claim' as const, query_id: _query_id };
}

export function loadGetterTupleClaim(source: TupleReader) {
    const _query_id = source.readBigNumber();
    return { $$type: 'Claim' as const, query_id: _query_id };
}

export function storeTupleClaim(source: Claim) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.query_id);
    return builder.build();
}

export function dictValueParserClaim(): DictionaryValue<Claim> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeClaim(src)).endCell());
        },
        parse: (src) => {
            return loadClaim(src.loadRef().beginParse());
        }
    }
}

export type BuyAbi = {
    $$type: 'BuyAbi';
    ref: Address | null;
}

export function storeBuyAbi(src: BuyAbi) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1112889602, 32);
        b_0.storeAddress(src.ref);
    };
}

export function loadBuyAbi(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1112889602) { throw Error('Invalid prefix'); }
    const _ref = sc_0.loadMaybeAddress();
    return { $$type: 'BuyAbi' as const, ref: _ref };
}

export function loadTupleBuyAbi(source: TupleReader) {
    const _ref = source.readAddressOpt();
    return { $$type: 'BuyAbi' as const, ref: _ref };
}

export function loadGetterTupleBuyAbi(source: TupleReader) {
    const _ref = source.readAddressOpt();
    return { $$type: 'BuyAbi' as const, ref: _ref };
}

export function storeTupleBuyAbi(source: BuyAbi) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.ref);
    return builder.build();
}

export function dictValueParserBuyAbi(): DictionaryValue<BuyAbi> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBuyAbi(src)).endCell());
        },
        parse: (src) => {
            return loadBuyAbi(src.loadRef().beginParse());
        }
    }
}

export type Withdraw = {
    $$type: 'Withdraw';
    amount: bigint;
}

export function storeWithdraw(src: Withdraw) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1464423496, 32);
        b_0.storeInt(src.amount, 257);
    };
}

export function loadWithdraw(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1464423496) { throw Error('Invalid prefix'); }
    const _amount = sc_0.loadIntBig(257);
    return { $$type: 'Withdraw' as const, amount: _amount };
}

export function loadTupleWithdraw(source: TupleReader) {
    const _amount = source.readBigNumber();
    return { $$type: 'Withdraw' as const, amount: _amount };
}

export function loadGetterTupleWithdraw(source: TupleReader) {
    const _amount = source.readBigNumber();
    return { $$type: 'Withdraw' as const, amount: _amount };
}

export function storeTupleWithdraw(source: Withdraw) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.amount);
    return builder.build();
}

export function dictValueParserWithdraw(): DictionaryValue<Withdraw> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeWithdraw(src)).endCell());
        },
        parse: (src) => {
            return loadWithdraw(src.loadRef().beginParse());
        }
    }
}

export type WithdrawJettons = {
    $$type: 'WithdrawJettons';
    to: Address;
    amount: bigint;
    query_id: bigint;
}

export function storeWithdrawJettons(src: WithdrawJettons) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1464489038, 32);
        b_0.storeAddress(src.to);
        b_0.storeInt(src.amount, 257);
        b_0.storeInt(src.query_id, 257);
    };
}

export function loadWithdrawJettons(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1464489038) { throw Error('Invalid prefix'); }
    const _to = sc_0.loadAddress();
    const _amount = sc_0.loadIntBig(257);
    const _query_id = sc_0.loadIntBig(257);
    return { $$type: 'WithdrawJettons' as const, to: _to, amount: _amount, query_id: _query_id };
}

export function loadTupleWithdrawJettons(source: TupleReader) {
    const _to = source.readAddress();
    const _amount = source.readBigNumber();
    const _query_id = source.readBigNumber();
    return { $$type: 'WithdrawJettons' as const, to: _to, amount: _amount, query_id: _query_id };
}

export function loadGetterTupleWithdrawJettons(source: TupleReader) {
    const _to = source.readAddress();
    const _amount = source.readBigNumber();
    const _query_id = source.readBigNumber();
    return { $$type: 'WithdrawJettons' as const, to: _to, amount: _amount, query_id: _query_id };
}

export function storeTupleWithdrawJettons(source: WithdrawJettons) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.to);
    builder.writeNumber(source.amount);
    builder.writeNumber(source.query_id);
    return builder.build();
}

export function dictValueParserWithdrawJettons(): DictionaryValue<WithdrawJettons> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeWithdrawJettons(src)).endCell());
        },
        parse: (src) => {
            return loadWithdrawJettons(src.loadRef().beginParse());
        }
    }
}

export type SetJettonWallet = {
    $$type: 'SetJettonWallet';
    wallet: Address;
}

export function storeSetJettonWallet(src: SetJettonWallet) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3101903737, 32);
        b_0.storeAddress(src.wallet);
    };
}

export function loadSetJettonWallet(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3101903737) { throw Error('Invalid prefix'); }
    const _wallet = sc_0.loadAddress();
    return { $$type: 'SetJettonWallet' as const, wallet: _wallet };
}

export function loadTupleSetJettonWallet(source: TupleReader) {
    const _wallet = source.readAddress();
    return { $$type: 'SetJettonWallet' as const, wallet: _wallet };
}

export function loadGetterTupleSetJettonWallet(source: TupleReader) {
    const _wallet = source.readAddress();
    return { $$type: 'SetJettonWallet' as const, wallet: _wallet };
}

export function storeTupleSetJettonWallet(source: SetJettonWallet) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.wallet);
    return builder.build();
}

export function dictValueParserSetJettonWallet(): DictionaryValue<SetJettonWallet> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSetJettonWallet(src)).endCell());
        },
        parse: (src) => {
            return loadSetJettonWallet(src.loadRef().beginParse());
        }
    }
}

export type ResolvePending = {
    $$type: 'ResolvePending';
    user: Address;
    action: bigint;
}

export function storeResolvePending(src: ResolvePending) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2390954843, 32);
        b_0.storeAddress(src.user);
        b_0.storeInt(src.action, 257);
    };
}

export function loadResolvePending(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2390954843) { throw Error('Invalid prefix'); }
    const _user = sc_0.loadAddress();
    const _action = sc_0.loadIntBig(257);
    return { $$type: 'ResolvePending' as const, user: _user, action: _action };
}

export function loadTupleResolvePending(source: TupleReader) {
    const _user = source.readAddress();
    const _action = source.readBigNumber();
    return { $$type: 'ResolvePending' as const, user: _user, action: _action };
}

export function loadGetterTupleResolvePending(source: TupleReader) {
    const _user = source.readAddress();
    const _action = source.readBigNumber();
    return { $$type: 'ResolvePending' as const, user: _user, action: _action };
}

export function storeTupleResolvePending(source: ResolvePending) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.user);
    builder.writeNumber(source.action);
    return builder.build();
}

export function dictValueParserResolvePending(): DictionaryValue<ResolvePending> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeResolvePending(src)).endCell());
        },
        parse: (src) => {
            return loadResolvePending(src.loadRef().beginParse());
        }
    }
}

export type CancelPending = {
    $$type: 'CancelPending';
}

export function storeCancelPending(src: CancelPending) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(4129785881, 32);
    };
}

export function loadCancelPending(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 4129785881) { throw Error('Invalid prefix'); }
    return { $$type: 'CancelPending' as const };
}

export function loadTupleCancelPending(source: TupleReader) {
    return { $$type: 'CancelPending' as const };
}

export function loadGetterTupleCancelPending(source: TupleReader) {
    return { $$type: 'CancelPending' as const };
}

export function storeTupleCancelPending(source: CancelPending) {
    const builder = new TupleBuilder();
    return builder.build();
}

export function dictValueParserCancelPending(): DictionaryValue<CancelPending> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeCancelPending(src)).endCell());
        },
        parse: (src) => {
            return loadCancelPending(src.loadRef().beginParse());
        }
    }
}

export type JettonTransferNotification = {
    $$type: 'JettonTransferNotification';
    query_id: bigint;
    amount: bigint;
    sender: Address;
    forward_payload: Cell;
}

export function storeJettonTransferNotification(src: JettonTransferNotification) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1935855772, 32);
        b_0.storeUint(src.query_id, 64);
        b_0.storeInt(src.amount, 257);
        b_0.storeAddress(src.sender);
        b_0.storeRef(src.forward_payload);
    };
}

export function loadJettonTransferNotification(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1935855772) { throw Error('Invalid prefix'); }
    const _query_id = sc_0.loadUintBig(64);
    const _amount = sc_0.loadIntBig(257);
    const _sender = sc_0.loadAddress();
    const _forward_payload = sc_0.loadRef();
    return { $$type: 'JettonTransferNotification' as const, query_id: _query_id, amount: _amount, sender: _sender, forward_payload: _forward_payload };
}

export function loadTupleJettonTransferNotification(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _forward_payload = source.readCell();
    return { $$type: 'JettonTransferNotification' as const, query_id: _query_id, amount: _amount, sender: _sender, forward_payload: _forward_payload };
}

export function loadGetterTupleJettonTransferNotification(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _forward_payload = source.readCell();
    return { $$type: 'JettonTransferNotification' as const, query_id: _query_id, amount: _amount, sender: _sender, forward_payload: _forward_payload };
}

export function storeTupleJettonTransferNotification(source: JettonTransferNotification) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.query_id);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.sender);
    builder.writeCell(source.forward_payload);
    return builder.build();
}

export function dictValueParserJettonTransferNotification(): DictionaryValue<JettonTransferNotification> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonTransferNotification(src)).endCell());
        },
        parse: (src) => {
            return loadJettonTransferNotification(src.loadRef().beginParse());
        }
    }
}

export type JettonExcesses = {
    $$type: 'JettonExcesses';
    query_id: bigint;
}

export function storeJettonExcesses(src: JettonExcesses) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3576854235, 32);
        b_0.storeUint(src.query_id, 64);
    };
}

export function loadJettonExcesses(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3576854235) { throw Error('Invalid prefix'); }
    const _query_id = sc_0.loadUintBig(64);
    return { $$type: 'JettonExcesses' as const, query_id: _query_id };
}

export function loadTupleJettonExcesses(source: TupleReader) {
    const _query_id = source.readBigNumber();
    return { $$type: 'JettonExcesses' as const, query_id: _query_id };
}

export function loadGetterTupleJettonExcesses(source: TupleReader) {
    const _query_id = source.readBigNumber();
    return { $$type: 'JettonExcesses' as const, query_id: _query_id };
}

export function storeTupleJettonExcesses(source: JettonExcesses) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.query_id);
    return builder.build();
}

export function dictValueParserJettonExcesses(): DictionaryValue<JettonExcesses> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonExcesses(src)).endCell());
        },
        parse: (src) => {
            return loadJettonExcesses(src.loadRef().beginParse());
        }
    }
}

export type Presale$Data = {
    $$type: 'Presale$Data';
    owner_: Address;
    jettonMaster_: Address;
    jettonWallet_: Address | null;
    totalSoldNano_: bigint;
    totalRaisedNano_: bigint;
    currentRound_: bigint;
    currentRoundSoldNano_: bigint;
    claimableBuyer_: Dictionary<Address, bigint>;
    claimableReferral_: Dictionary<Address, bigint>;
    creditedBuyer_: Dictionary<Address, bigint>;
    creditedRef_: Dictionary<Address, bigint>;
    claimedBuyer_: Dictionary<Address, bigint>;
    claimedRef_: Dictionary<Address, bigint>;
    pendingTotal_: Dictionary<Address, bigint>;
    pendingBuyer_: Dictionary<Address, bigint>;
    pendingReferral_: Dictionary<Address, bigint>;
    pendingUntil_: Dictionary<Address, bigint>;
    pendingQid_: Dictionary<Address, bigint>;
    nextQid_: bigint;
    userByQid_: Dictionary<bigint, Address>;
    totalClaimableNano_: bigint;
    totalPendingNano_: bigint;
}

export function storePresale$Data(src: Presale$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner_);
        b_0.storeAddress(src.jettonMaster_);
        b_0.storeAddress(src.jettonWallet_);
        const b_1 = new Builder();
        b_1.storeInt(src.totalSoldNano_, 257);
        b_1.storeInt(src.totalRaisedNano_, 257);
        b_1.storeInt(src.currentRound_, 257);
        const b_2 = new Builder();
        b_2.storeInt(src.currentRoundSoldNano_, 257);
        b_2.storeDict(src.claimableBuyer_, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257));
        b_2.storeDict(src.claimableReferral_, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257));
        b_2.storeDict(src.creditedBuyer_, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257));
        const b_3 = new Builder();
        b_3.storeDict(src.creditedRef_, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257));
        b_3.storeDict(src.claimedBuyer_, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257));
        b_3.storeDict(src.claimedRef_, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257));
        const b_4 = new Builder();
        b_4.storeDict(src.pendingTotal_, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257));
        b_4.storeDict(src.pendingBuyer_, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257));
        b_4.storeDict(src.pendingReferral_, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257));
        const b_5 = new Builder();
        b_5.storeDict(src.pendingUntil_, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257));
        b_5.storeDict(src.pendingQid_, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257));
        b_5.storeInt(src.nextQid_, 257);
        b_5.storeDict(src.userByQid_, Dictionary.Keys.BigInt(257), Dictionary.Values.Address());
        b_5.storeInt(src.totalClaimableNano_, 257);
        b_5.storeInt(src.totalPendingNano_, 257);
        b_4.storeRef(b_5.endCell());
        b_3.storeRef(b_4.endCell());
        b_2.storeRef(b_3.endCell());
        b_1.storeRef(b_2.endCell());
        b_0.storeRef(b_1.endCell());
    };
}

export function loadPresale$Data(slice: Slice) {
    const sc_0 = slice;
    const _owner_ = sc_0.loadAddress();
    const _jettonMaster_ = sc_0.loadAddress();
    const _jettonWallet_ = sc_0.loadMaybeAddress();
    const sc_1 = sc_0.loadRef().beginParse();
    const _totalSoldNano_ = sc_1.loadIntBig(257);
    const _totalRaisedNano_ = sc_1.loadIntBig(257);
    const _currentRound_ = sc_1.loadIntBig(257);
    const sc_2 = sc_1.loadRef().beginParse();
    const _currentRoundSoldNano_ = sc_2.loadIntBig(257);
    const _claimableBuyer_ = Dictionary.load(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), sc_2);
    const _claimableReferral_ = Dictionary.load(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), sc_2);
    const _creditedBuyer_ = Dictionary.load(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), sc_2);
    const sc_3 = sc_2.loadRef().beginParse();
    const _creditedRef_ = Dictionary.load(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), sc_3);
    const _claimedBuyer_ = Dictionary.load(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), sc_3);
    const _claimedRef_ = Dictionary.load(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), sc_3);
    const sc_4 = sc_3.loadRef().beginParse();
    const _pendingTotal_ = Dictionary.load(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), sc_4);
    const _pendingBuyer_ = Dictionary.load(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), sc_4);
    const _pendingReferral_ = Dictionary.load(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), sc_4);
    const sc_5 = sc_4.loadRef().beginParse();
    const _pendingUntil_ = Dictionary.load(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), sc_5);
    const _pendingQid_ = Dictionary.load(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), sc_5);
    const _nextQid_ = sc_5.loadIntBig(257);
    const _userByQid_ = Dictionary.load(Dictionary.Keys.BigInt(257), Dictionary.Values.Address(), sc_5);
    const _totalClaimableNano_ = sc_5.loadIntBig(257);
    const _totalPendingNano_ = sc_5.loadIntBig(257);
    return { $$type: 'Presale$Data' as const, owner_: _owner_, jettonMaster_: _jettonMaster_, jettonWallet_: _jettonWallet_, totalSoldNano_: _totalSoldNano_, totalRaisedNano_: _totalRaisedNano_, currentRound_: _currentRound_, currentRoundSoldNano_: _currentRoundSoldNano_, claimableBuyer_: _claimableBuyer_, claimableReferral_: _claimableReferral_, creditedBuyer_: _creditedBuyer_, creditedRef_: _creditedRef_, claimedBuyer_: _claimedBuyer_, claimedRef_: _claimedRef_, pendingTotal_: _pendingTotal_, pendingBuyer_: _pendingBuyer_, pendingReferral_: _pendingReferral_, pendingUntil_: _pendingUntil_, pendingQid_: _pendingQid_, nextQid_: _nextQid_, userByQid_: _userByQid_, totalClaimableNano_: _totalClaimableNano_, totalPendingNano_: _totalPendingNano_ };
}

export function loadTuplePresale$Data(source: TupleReader) {
    const _owner_ = source.readAddress();
    const _jettonMaster_ = source.readAddress();
    const _jettonWallet_ = source.readAddressOpt();
    const _totalSoldNano_ = source.readBigNumber();
    const _totalRaisedNano_ = source.readBigNumber();
    const _currentRound_ = source.readBigNumber();
    const _currentRoundSoldNano_ = source.readBigNumber();
    const _claimableBuyer_ = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _claimableReferral_ = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _creditedBuyer_ = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _creditedRef_ = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _claimedBuyer_ = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _claimedRef_ = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _pendingTotal_ = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    source = source.readTuple();
    const _pendingBuyer_ = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _pendingReferral_ = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _pendingUntil_ = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _pendingQid_ = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _nextQid_ = source.readBigNumber();
    const _userByQid_ = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), Dictionary.Values.Address(), source.readCellOpt());
    const _totalClaimableNano_ = source.readBigNumber();
    const _totalPendingNano_ = source.readBigNumber();
    return { $$type: 'Presale$Data' as const, owner_: _owner_, jettonMaster_: _jettonMaster_, jettonWallet_: _jettonWallet_, totalSoldNano_: _totalSoldNano_, totalRaisedNano_: _totalRaisedNano_, currentRound_: _currentRound_, currentRoundSoldNano_: _currentRoundSoldNano_, claimableBuyer_: _claimableBuyer_, claimableReferral_: _claimableReferral_, creditedBuyer_: _creditedBuyer_, creditedRef_: _creditedRef_, claimedBuyer_: _claimedBuyer_, claimedRef_: _claimedRef_, pendingTotal_: _pendingTotal_, pendingBuyer_: _pendingBuyer_, pendingReferral_: _pendingReferral_, pendingUntil_: _pendingUntil_, pendingQid_: _pendingQid_, nextQid_: _nextQid_, userByQid_: _userByQid_, totalClaimableNano_: _totalClaimableNano_, totalPendingNano_: _totalPendingNano_ };
}

export function loadGetterTuplePresale$Data(source: TupleReader) {
    const _owner_ = source.readAddress();
    const _jettonMaster_ = source.readAddress();
    const _jettonWallet_ = source.readAddressOpt();
    const _totalSoldNano_ = source.readBigNumber();
    const _totalRaisedNano_ = source.readBigNumber();
    const _currentRound_ = source.readBigNumber();
    const _currentRoundSoldNano_ = source.readBigNumber();
    const _claimableBuyer_ = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _claimableReferral_ = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _creditedBuyer_ = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _creditedRef_ = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _claimedBuyer_ = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _claimedRef_ = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _pendingTotal_ = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _pendingBuyer_ = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _pendingReferral_ = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _pendingUntil_ = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _pendingQid_ = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _nextQid_ = source.readBigNumber();
    const _userByQid_ = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), Dictionary.Values.Address(), source.readCellOpt());
    const _totalClaimableNano_ = source.readBigNumber();
    const _totalPendingNano_ = source.readBigNumber();
    return { $$type: 'Presale$Data' as const, owner_: _owner_, jettonMaster_: _jettonMaster_, jettonWallet_: _jettonWallet_, totalSoldNano_: _totalSoldNano_, totalRaisedNano_: _totalRaisedNano_, currentRound_: _currentRound_, currentRoundSoldNano_: _currentRoundSoldNano_, claimableBuyer_: _claimableBuyer_, claimableReferral_: _claimableReferral_, creditedBuyer_: _creditedBuyer_, creditedRef_: _creditedRef_, claimedBuyer_: _claimedBuyer_, claimedRef_: _claimedRef_, pendingTotal_: _pendingTotal_, pendingBuyer_: _pendingBuyer_, pendingReferral_: _pendingReferral_, pendingUntil_: _pendingUntil_, pendingQid_: _pendingQid_, nextQid_: _nextQid_, userByQid_: _userByQid_, totalClaimableNano_: _totalClaimableNano_, totalPendingNano_: _totalPendingNano_ };
}

export function storeTuplePresale$Data(source: Presale$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.owner_);
    builder.writeAddress(source.jettonMaster_);
    builder.writeAddress(source.jettonWallet_);
    builder.writeNumber(source.totalSoldNano_);
    builder.writeNumber(source.totalRaisedNano_);
    builder.writeNumber(source.currentRound_);
    builder.writeNumber(source.currentRoundSoldNano_);
    builder.writeCell(source.claimableBuyer_.size > 0 ? beginCell().storeDictDirect(source.claimableBuyer_, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257)).endCell() : null);
    builder.writeCell(source.claimableReferral_.size > 0 ? beginCell().storeDictDirect(source.claimableReferral_, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257)).endCell() : null);
    builder.writeCell(source.creditedBuyer_.size > 0 ? beginCell().storeDictDirect(source.creditedBuyer_, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257)).endCell() : null);
    builder.writeCell(source.creditedRef_.size > 0 ? beginCell().storeDictDirect(source.creditedRef_, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257)).endCell() : null);
    builder.writeCell(source.claimedBuyer_.size > 0 ? beginCell().storeDictDirect(source.claimedBuyer_, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257)).endCell() : null);
    builder.writeCell(source.claimedRef_.size > 0 ? beginCell().storeDictDirect(source.claimedRef_, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257)).endCell() : null);
    builder.writeCell(source.pendingTotal_.size > 0 ? beginCell().storeDictDirect(source.pendingTotal_, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257)).endCell() : null);
    builder.writeCell(source.pendingBuyer_.size > 0 ? beginCell().storeDictDirect(source.pendingBuyer_, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257)).endCell() : null);
    builder.writeCell(source.pendingReferral_.size > 0 ? beginCell().storeDictDirect(source.pendingReferral_, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257)).endCell() : null);
    builder.writeCell(source.pendingUntil_.size > 0 ? beginCell().storeDictDirect(source.pendingUntil_, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257)).endCell() : null);
    builder.writeCell(source.pendingQid_.size > 0 ? beginCell().storeDictDirect(source.pendingQid_, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257)).endCell() : null);
    builder.writeNumber(source.nextQid_);
    builder.writeCell(source.userByQid_.size > 0 ? beginCell().storeDictDirect(source.userByQid_, Dictionary.Keys.BigInt(257), Dictionary.Values.Address()).endCell() : null);
    builder.writeNumber(source.totalClaimableNano_);
    builder.writeNumber(source.totalPendingNano_);
    return builder.build();
}

export function dictValueParserPresale$Data(): DictionaryValue<Presale$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storePresale$Data(src)).endCell());
        },
        parse: (src) => {
            return loadPresale$Data(src.loadRef().beginParse());
        }
    }
}

 type Presale_init_args = {
    $$type: 'Presale_init_args';
    owner: Address;
    jettonMaster: Address;
}

function initPresale_init_args(src: Presale_init_args) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.jettonMaster);
    };
}

async function Presale_init(owner: Address, jettonMaster: Address) {
    const __code = Cell.fromHex('b5ee9c724102950100257500022cff008e88f4a413f4bcf2c80bed53208e8130e1ed43d9013802027102240201200312020120040c02016205070260a908ed44d0d200018e1cfa40fa405902d1016d705470006d6d6d6d6d6d6d6d6d6d6d716d53dde30ddb3c57105f0f6c613906000221020148080a025fa23fb513434800063873e903e901640b4405b5c151c001b5b5b5b5b5b5b5b5b5b5b5c5b54f778c376cf15c417c3db186390900045610025fa13fb513434800063873e903e901640b4405b5c151c001b5b5b5b5b5b5b5b5b5b5b5c5b54f778c376cf15c417c3db186390b00022f0201480d0f02b5ad9f76a268690000c70e7d207d202c816880b6b82a380036b6b6b6b6b6b6b6b6b6b6b8b6a9eef186888a888b088a888a088a888a0889888a088988890889888908888889088888880888888807888807aa876d9e2b882f87b630c0390e0104db3c8202b5aeb1f6a268690000c70e7d207d202c816880b6b82a380036b6b6b6b6b6b6b6b6b6b6b8b6a9eef186888a888b088a888a088a888a0889888a088988890889888908888889088888880888888807888807aa876d9e2b882f87b630c0391003f41115111611151114111611141113111611131112111611121111111611111110111611100f11160f0e11160e0d11160d0c11160c561655b011175617db3c52a01118db3c01111701a120c200923070df1115111611151114111511141113111411131112111311121111111211111110111111100f11100f10ef5a5a11003010de10cd10bc10ab109a10891078106710561045103441300201201319020120141702b5b114fb513434800063873e903e901640b4405b5c151c001b5b5b5b5b5b5b5b5b5b5b5c5b54f778c34445444584454445044544450444c4450444c4448444c44484444444844444440444444403c44403d543b6cf15c417c3db1860391503f41115111611151114111611141113111611131112111611121111111611111110111611100f11160f0e11160e0d11160d561655c011175617db3c52b01118db3c01111701a120c200923070df1115111611151114111511141113111411131112111311121111111211111110111111100f11100f10ef10de10cd5a5a16002810bc10ab109a108910781067105610451034413002b5b1303b513434800063873e903e901640b4405b5c151c001b5b5b5b5b5b5b5b5b5b5b5c5b54f778c34445444584454445044544450444c4450444c4448444c44484444444844444440444444403c44403d543b6cf15c417c3db18603918010edb3c91719170e26c0201201a220201201b1d0261ac0af6a268690000c70e7d207d202c816880b6b82a380036b6b6b6b6b6b6b6b6b6b6b8b6a9eef186ed9e2b882f87b630c0391c000456130201581e20025fa445da89a1a400031c39f481f480b205a202dae0a8e000dadadadadadadadadadadae2daa7bbc61bb678ae20be1ed8c3391f00045612025fa57dda89a1a400031c39f481f480b205a202dae0a8e000dadadadadadadadadadadae2daa7bbc61bb678ae20be1ed8c339210004800d0261b302bb513434800063873e903e901640b4405b5c151c001b5b5b5b5b5b5b5b5b5b5b5c5b54f778c376cf15c417c3db1860392300045611020120252d02015826280261b2affb513434800063873e903e901640b4405b5c151c001b5b5b5b5b5b5b5b5b5b5b5c5b54f778c376cf15c417c3db18603927001256136eb391719170e2020162292b02b3a677da89a1a400031c39f481f480b205a202dae0a8e000dadadadadadadadadadadae2daa7bbc61a222a222c222a2228222a22282226222822262224222622242222222422222220222222201e22201eaa1db678ae20be1ed8c3392a0104db3c85025fa55bda89a1a400031c39f481f480b205a202dae0a8e000dadadadadadadadadadadae2daa7bbc61bb678ae20be1ed8c3392c000456150201582e330201662f3102b3a497da89a1a400031c39f481f480b205a202dae0a8e000dadadadadadadadadadadae2daa7bbc61a222a222c222a2228222a22282226222822262224222622242222222422222220222222201e22201eaa1db678ae20be1ed8c339300104db3c66025fa5a5da89a1a400031c39f481f480b205a202dae0a8e000dadadadadadadadadadadae2daa7bbc61bb678ae20be1ed8c33932000220020148343602b4a9fced44d0d200018e1cfa40fa405902d1016d705470006d6d6d6d6d6d6d6d6d6d6d716d53dde30d1115111611151114111511141113111411131112111311121111111211111110111111100f11100f550edb3c57105f0f6c6139350104db3c6d0260a998ed44d0d200018e1cfa40fa405902d1016d705470006d6d6d6d6d6d6d6d6d6d6d716d53dde30ddb3c57105f0f6c6139370004561404c801d072d721d200d200fa4021103450666f04f86102f862ed44d0d200018e1cfa40fa405902d1016d705470006d6d6d6d6d6d6d6d6d6d6d716d53dde30d1117e302705616d74920c21f97315616d70b1f01de218210b8e34b79bae30221821057495448ba393b3d3e01f4fa40fa40d72c01916d93fa4001e201d401d0810101d700810101d700810101d700d430d0810101d700f404f404f404d430d0f404f404f404d430d0f404f404f404d430d0f404f404810101d700f404810101d700810101d7003011131116111311131115111311131114111357161114111511141113111411133a00301112111311121111111211111110111111100f11100f550e03fc11158020d72120d749c1608ea7301113111511131112111411121111111311111110111211100f11110f0e11100e10df551cdb3ce0d31f0182100f8a7ea5bd8ea7301113111511131112111411121111111311111110111211100f11110f0e11100e10df551cdb3ce0d33f3011141116111411131115111311121114111293933c02621111111311111110111211100f11110f0e11100e10df10ce10bd10ac109b108a10791068105710461035443012db3cdb3c469301a85b11158020d721fa40308200bb75f8425616c705f2f48112bcf8285220c705b3f2f481557e11136e01111301f2f41113111511131112111411121111111311111110111211100f11110f0e11100e10df551cdb3c93043ce302218210574a544ebae3022182108e83135bbae30221821042555902ba3f41435202fc5b11158020d721810101d700308200bb75f8425616c705f2f48172d021c200f2f48200804ef8276f1022a182107e5ca200bef2f470718856175530146d50436d5033c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00111311151113111211141112914001341111111311111110111211100f11110f0e11100e10df551cdb3c9302fc5b11158020d721fa40810101d700308200bb75f8425617c705f2f4812a0a56146eb3f2f48172d021c200f2f48200be105617c000f2f48200e7f45618c000f2f4011116011117db3c1116111811161115111711151114111611141113111511131112111411121111111311111110111211100f11110f0e11100e10df10ce5c42023210bd10ac109b108a10791068105710461035443012db3cdb3c619301fc5b11158020d721fa40810101d7003082009bd9f8425617c705917f95f84223c705e2f2f41114111511141113111511131112111511121111111511111110111511100f11150f0e11150e0d11150d0c11150c0b11150b0a11150a0911150908111508071115070611150605111505041115040311150302111502011115014403fa111682008df111185616db3c01111901f2f4816a52f8231115111611151114111611141113111611131112111611121111111611111110111611100f11160f0e11160e0d11160d0c11160c0b11160b0a11160a09111609081116080711160706111606051116050411160403111603021116020111160111195617db3c6c6645038801111a01bc01111601f2f481693d1117c00201111701f2f41112111611121111111511111110111411100f11130f0e11120e0d11110d0c11100c553b4330db3cdb3cdb3c6d469301f2238101012259f40c6fa1319130e1238101012259f40c6fa192306ddf206ef2d0801115111711151114111611141113111711131112111611121111111711111110111611100f11170f0e11160e0d11170d0c11160c0b11170b0a11160a091117090811160807111707061116060511170504111604031117034703e2021116020111170111165616db3c8e26571657161113111511131112111411121111111311111110111211100f11110f0e11100e551de15616db3c011118bd8e2657151113111511131112111411121111111311111110111211100f11110f0e11100e10df551ce02781010b56178101016c6d4803fa4133f40a6fa19401d70030925b6de2206ef2d0802781010b561859f40a6fa1318e1d2781010b56188101014133f40a6fa19401d70030925b6de2206ef2d0809170e22781010b561959f40a6fa1318e1d2781010b56198101014133f40a6fa19401d70030925b6de2206ef2d0809170e221c200e30020c200e30021c200494a4d02fe1115111711151114111611141113111711131112111611121111111711111110111611100f11170f0e11160e0d11170d0c11160c0b11170b56160b0a11180a090811180807061118060504111804030211180201111a01111756195619db3c11191115111711151114111611141113111511131112111411121111111311114b4c02fe1115111711151114111611141113111711131112111611121111111711111110111611100f11170f0e11160e0d11170d0c11160c0b11170b0a11160a56170a091117090807111707060511170504031117030201111a0111185619561bdb3c11191115111711151114111611141113111511131112111411121111111311114b4c007a20c101925f03e02281010b2359f40a6fa1318e1e2281010b238101014133f40a6fa19401d70030925b6de26c22206ef2d080936c2170e25301bb6c2130004c1110111211100f11110f0e11100e10df10ce10bd10ac109b108a10791068105710461035443004fa9131e30d20c2008e8b01111801561701db3c11179130e21115111611151114111511141113111411131112111311121111111211111110111111100f11100f10ef10de10cd10bc10ab109a108910781067105610451034413001111701db3c1115111611151114111511141113111411131112111311121111111211114e516f7002f61116111711161115111711151114111711141113111711131112111711121111111711111110111711100f11170f0e11170e0d11170d0c11170c0b11170b0a11170a091117090811170807111707061117060511170504111704031117030211170201111901561801111adb3c11181115111611151114111511144f5000b820c101915be0561081010b2359f40a6fa1318e1d561081010b238101014133f40a6fa19401d70030925b6de2206ef2d0809170e281010b5112a0031112031201111201810101216e955b59f4593098c801cf004133f441e2502fa001006c1113111411131112111311121111111211111110111111100f11100f10ef10de10cd10bc10ab109a108910781067105610451034413000b420c101915be02f81010b2359f40a6fa1318e1c2f81010b238101014133f40a6fa19401d70030925b6de2206ef2d0809170e281010b5112a0031111031201111101810101216e955b59f4593098c801cf004133f441e2502ea00104ea8fea5b11158020d721d72c01916d93fa4001e231206eb39a20206ef2d080f842c7059170e28ec11114111611141113111511131112111411121111111311111110111211100f11110f0e11100e10df10ce10bd10ac109b108a10791068105710461035443012db3ce30ddb3ce0218210434c4149ba7a5393540150301113111511131112111411121111111311111110111211100f11110f0e11100e10df551c6ddb3c7a043ce302218210f6278819bae3022182107362d09cbae302218210d53276dbba5564686702fe5b5715812a0a56126eb3f2f48121cef8416f24135f03821029b92700bef2f48113a1f8276f10821035a4e900bef2f4f8421114111511141113111411131112111311121111111211111110111111100f11100f10ef10de10cd10bc10ab109a108910781067105610451034111641305616db3c111411151114111311151113565700023003f61112111511121111111511111110111511100f11150f0e11150e0d11150d0c11150c0b11150b0a11150a091115091115080706554082008afe11165617db3cb301111701f2f41114111511141113111411131112111311121111111211111110111111100f11100f10ef2b10ef0d0e550b5617db3c1115111611156c5a5803f41114111611141113111611131112111611121111111611111110111611100f11160f0e11160e0d11160d0c11160c561655b011175618db3c1115111611151114111611141113111611131112111611121111111611111110111611100f11160f0e11160e0d11160d0c11160c0b11160b561655a011175619db3c5a5a5902fc1115111611151114111611141113111611131112111611121111111611111110111611100f11160f0e11160e0d11160d0c11160c0b11160b0a11160a561655901117561adb3c011119011117a1011117011116a15615c10093705716de20c100923070de561521a08154f021c200f2f48200a02d561822bef2f4011117015a5b00582181010b2259f40a6fa1318e1b81010b018101014133f40a6fa19401d70030925b6de2206ef2d080925b70e203fa1118db3c1115111611151114111611141113111611131112111611121111111611111110111611100f11160f0e11160e0d11160d0c11160c0b11160b0a11160a0911160911160807065540561a561a5619561b561adb3c015619a1015619a01115111611151114111511141113111411131112111311121111111211115c5d5f003023a9383f20c101923071de04a4a9383f20c101923071de0401f41d81010b542055810101216e955b59f4593098c801cf004133f441e21b81010b54204d810101216e955b59f4593098c801cf004133f441e21981010b54203d810101216e955b59f4593098c801cf004133f441e281010bf8238100b4a023103a01810101216e955b59f4593098c801cf004133f441e20681010b5e00665329810101216e955b59f4593098c801cf004133f441e210248101015092206e953059f45a30944133f414e21078105610450203fa1110111111100f11100f10ef2a10ef10de0c0d10ab109a1089107810671056104510344130561b011119db3c1115111611151114111511141113111411131112111311121111111211111110111111100f11100f10ef2910ef10de10cd0b0c109a1089107810671056104510344130561a011119db3c0e81010b5619708e8e6002f6810101216e955b59f4593098c801cf004133f441e20d81010b561970810101216e955b59f4593098c801cf004133f441e21115111811151114111711141113111611131112111511121111111411111110111311100f11120f0d11110d111010cf10be10ad109c108b107a106910581047103645401023db3cdb3c619303f6812a0a56176eb3f2f48172d022c200f2f48200ce6321c200f2f4887f6dc882100f8a7ea501cb1f14cb3f5004fa025004cf16f828cf16f4008208989680fa02ca00ccc95614206ef2d080821023c34600587f017050346d036d5520c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf818ae2f400c9916263001a58cf8680cf8480f400f400cf81000601fb0002fc5b5715f842111582008df111175616db3c01111801f2f4816a52f8231115111611151114111611141113111611131112111611121111111611111110111611100f11160f0e11160e0d11160d0c11160c0b11160b0a11160a09111609081116080711160706111606051116050411160403111603021116020111160111186c6504765617db3c01111901bc01111601f2f41113111611131112111511121111111411111110111311100f11120f0e11110e0d11100d10cf552bdb3cdb3c666d6a9200582681010b2259f40a6fa1318e1c81010b27028101014133f40a6fa19401d70030925b6de2206ef2d080e030700448e302218210946a98b6bae30201c00001c121b0e302f842f8416f24135f035617d749c1206873747503fe5b11158020d721d33f3056126e8ea7301113111511131112111411121111111311111110111211100f11110f0e11100e10df551cdb3ce0f8425613206ef2d080c705b38ea7301113111511131112111411121111111311111110111211100f11110f0e11100e10df551cdb3ce011141116111411131115111311121114111293936902621111111311111110111211100f11110f0e11100e10df10ce10bd10ac109b108a10791068105710461035443012db3cdb3c6a9301f2238101012259f40c6fa1319130e1238101012259f40c6fa192306ddf206ef2d0801115111711151114111611141113111711131112111611121111111711111110111611100f11170f0e11160e0d11170d0c11160c0b11170b0a11160a091117090811160807111707061116060511170504111604031117036b03e2021116020111170111165616db3c8e26571657161113111511131112111411121111111311111110111211100f11110f0e11100e551de15616db3c011118bd8e2657151113111511131112111411121111111311111110111211100f11110f0e11100e10df551ce02781010b56178101016c6d6e005e2981010b2259f40a6fa1318e1e81010b2a028101014133f40a6fa19401d70030925b6de2206ef2d080c200923070e200582581010b2259f40a6fa1318e1c81010b26028101014133f40a6fa19401d70030925b6de2206ef2d080e0307002f44133f40a6fa19401d70030925b6de2206ef2d0801115111611151114111511141113111411131112111311121111111211111110111111100f11100f10ef10de10cd10bc10ab109a108910781067105610451034413001111701db3c1115111611151114111511141113111411131112111311121111111211116f70001c20c1019130e05cbe91a1925b70e2011c1110111111100f11100f550edb3c7101ec0981010b2a70810101216e955b59f4593098c801cf004133f441e20881010b2a70810101216e955b59f4593098c801cf004133f441e20781010b2a70810101216e955b59f4593098c801cf004133f441e20681010b2a70810101216e955b59f4593098c801cf004133f441e21581010b500a70810101720032216e955b59f4593098c801cf004133f441e21078106710560401f85b11158020d721d33f30c8018210aff90f5758cb1fcb3fc91114111611141113111511131112111411121111111311111110111211100f11110f0e11100e10df10ce10bd10ac109b108a10791068105710461035443012f84270705003804201503304c8cf8580ca00cf8440ce01fa02806acf40f400c901fb00db3c93025657151113111511131112111411121111111311111110111211100f11110f0e11100e10df551c6ddb3cdb3c7a9303fc8f7b57175616c2008edc1115111711151114111611141113111511131112111411121111111311111110111211100f11110f0e11100e10df10ce10bd10ac109b108a10791068105710461035440302db3c1115011114011113011112011111011110010f55c193305715e2111311151113111211141112111111131111e090787604fc1117d31f01821042555901bde30257176d5617d749c2008e1e1117d200018e1420d74981010bbe9957171116fa403011169130e29130e2925717e256166eb39a5616206ef2d08001c705923070e28eac1114111611141113111511131112111411121111111311111110111211100f11110f0e11100e10df551cdb3ce30d777a799202f4305616c2008edc1115111711151114111611141113111511131112111411121111111311111110111211100f11110f0e11100e10df10ce10bd10ac109b108a10791068105710461035440302db3c1115011114011113011112011111011110010f55c193305715e2111311151113111211141112111111131111907801281110111211100f11110f0e11100e10df551cdb3c93015257151113111511131112111411121111111311111110111211100f11110f0e11100e10df551c6ddb3c7a03f6f842f8416f24135f0320c101925f03e01115111811151114111711141113111611131112111811121111111711111110111611100f11180f0e11170e0d11160d0c11180c0b11170b0a11160a0911180908111708071116070611180605111705041116040311180302111702011116011118db3ce30256187070217f7b7c016857171114111711141113111611131112111511121111111411111110111311100f11120f0e11110e0d11100d10cf10be552adb3c9004fa8a8e95a4208100c8be92317f8e8823c10192317fe30ee201e85b20c1018eb55b57171114111711141113111611131112111511121111111411111110111311100f11120f0e11110e0d11100d10cf10be552adb3ce0571a56198200c350a882080f4240a904561a01a0111a8200c350a882080f4240a9041116111711167d7e9089000421b303f81115111911151114111811141113111711131112111611121111111911111110111811100f11170f0e11160e0d11190d0c11180c0b11170b0a11160a0911190908111808071117070611160605111905041118040311170302111602011119011118db3c9357197fe30e1115111911151114111811141113111711137f8088013c5610c1139170e05610c213917fe08013db3c20c20094561001be923070e28201c65610c2ff945610c1149170e28e11571911181114111311121111111055e07fe30d1115111911151114111511141113111411131112111311121111111211111110111111100f11100f10ef10de10cd10bc10ab109a10891078106710561045103441308103ca5610db3c11151116111511141116111411131116111311121116111211111116111156161111111055e01117db3c5617c101917f9320c101e29630571657197f8ea211175610a120c1018e163057162fc2129357197f9a3e0ea40d11180d0e700ee2e30ee28285870112db3c82103b9aca00a88301f4209630820be3413ee120c0019630820b665b35e020c0029630820b00995ce020c0039630820aa45dffe020c0049630820a5333ffe020c0059630820a0bc75de020c00696308209ccece0e020c00796308209959d40e020c0089630820964f0c7e020c009963082093a1b91e020c00a96308209146a2de020c00b8400b096308208f33eb7e020c00c96308208d60e3be020c00d96308208bc5e71e020c00e96308208a5c3c0e020c00f9630820891df75e020c01096308208805e3ee020c01196308208714523e0c012958208636885e08208577ab301f42096308208af4ee8e120c00196308208cd1fb8e020c00296308208f00168e020c0039630820918ceb8e020c00496308209488d60e020c00596308209806258e020c00696308209c1b118e020c0079630820a0e2b38e020c0089630820a679da8e020c0099630820ad04e70e020c00a9630820b4ac218e020c00b8600c09630820bd9fe10e020c00c9730821004819c38e020c00d973082100545b758e020c00e97308210062b3558e020c00f973082100737a030e020c010973082100871ba58e020c0119730821009e14048e0c0129682100b8f3698e082100d7e8b4800e8561982103b9aca00a85618a90420c101965b571657197f8e5a5301bc91309131e2201118a882103b9aca00a90420c1019630571657197f8e3911105617a011135617a011125610a0011118011117a0011118010fa120c100923070de111711190e11160e0e11150e1110111111100e11100ee2e2006e1112111611121111111511111110111411100f11130f0e11120e0d11110d0c11100c10bf10ae109d108c107b106a10591048103746501403f41115111711151114111711141113111711131112111711121111111711111110111711100f11170f0e11170e0d11170d0c11170c0b11170b0a11170a091117090811170807111707061117060511170504111704031117030211170201111701561801111bdb3c56186eb39457185718e30d56148208989680be8a8b8f01c420c101915be0561081010b2359f40a6fa1318e1d561081010b238101014133f40a6fa19401d70030925b6de2206ef2d0809170e281010b5112a0021112025230810101216e955b59f4593098c801cf004133f441e2035610a003111003544e04db3c8e01365618206ef2d0805618c705b3945619c2009170e29457185718e30d8c01dc1118206ef2d0801115111711151114111611141113111511131112111411121111111311111110111211100f11110f0e11100e10df10ce10bd10ac109b108a10791068105710461035443002111802011119db3c01111701111601111501111401111301111201111101111055d18d01ba20c101915be02f81010b2359f40a6fa1318e1c2f81010b238101014133f40a6fa19401d70030925b6de2206ef2d0809170e281010b5112a0021111025230810101216e955b59f4593098c801cf004133f441e2513fa0103f544d04db3c8e006c20c10131915be02181010b2259f40a6fa1318e1f2181010b228101014133f40a6fa19401d70030925b6de26c21206ef2d08030915be201d08ec21113111711131112111611121111111511111110111411100f11130f0e11120e0d11110d0c11100c553bdb3c011115011114031113030211120201111101111055b39457145714e21111111511111110111411100f11130f0e11120e0d11110d0c11100c553b90018020c101915be070887050346d036d5520c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb009100000104db3c93012ac87f01ca00111611151114111311121111111055e09400ee011115011116ce01111301ce011111206e9430cf84809201cee20fc8810101cf001e810101cf001c810101cf000ac8810101cf0019f40017f40015f40003c8f40012f400f40002c8f40013f40013f40004c8f40015f40016810101cf0016f40016810101cf0016810101cf0014cdcd13cd12cdcdc9ed54d361ed1a');
    const builder = beginCell();
    builder.storeUint(0, 1);
    initPresale_init_args({ $$type: 'Presale_init_args', owner, jettonMaster })(builder);
    const __data = builder.endCell();
    return { code: __code, data: __data };
}

export const Presale_errors = {
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
    4796: { message: "BAD_WALLET" },
    5025: { message: "LOW_BALANCE" },
    8654: { message: "ATTACH_MORE_TON" },
    10762: { message: "JETTON_WALLET_NOT_SET" },
    21744: { message: "NOTHING_TO_CLAIM" },
    21886: { message: "JETTON_WALLET_ALREADY_SET" },
    26941: { message: "ONLY_RESTORE_ALLOWED" },
    27218: { message: "PENDING_NOT_EXPIRED" },
    29392: { message: "BAD_AMOUNT" },
    32846: { message: "KEEP_MIN_BALANCE" },
    35582: { message: "CLAIM_PENDING_TRY_LATER" },
    36337: { message: "NO_PENDING" },
    39897: { message: "NOT_OWNER_OR_USER" },
    41005: { message: "INTERNAL_CLAIMABLE_UNDERFLOW" },
    47989: { message: "NOT_OWNER" },
    48656: { message: "CLAIMABLE_EXISTS" },
    52835: { message: "BAD_QID" },
    59380: { message: "PENDING_EXISTS" },
} as const

export const Presale_errors_backward = {
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
    "BAD_WALLET": 4796,
    "LOW_BALANCE": 5025,
    "ATTACH_MORE_TON": 8654,
    "JETTON_WALLET_NOT_SET": 10762,
    "NOTHING_TO_CLAIM": 21744,
    "JETTON_WALLET_ALREADY_SET": 21886,
    "ONLY_RESTORE_ALLOWED": 26941,
    "PENDING_NOT_EXPIRED": 27218,
    "BAD_AMOUNT": 29392,
    "KEEP_MIN_BALANCE": 32846,
    "CLAIM_PENDING_TRY_LATER": 35582,
    "NO_PENDING": 36337,
    "NOT_OWNER_OR_USER": 39897,
    "INTERNAL_CLAIMABLE_UNDERFLOW": 41005,
    "NOT_OWNER": 47989,
    "CLAIMABLE_EXISTS": 48656,
    "BAD_QID": 52835,
    "PENDING_EXISTS": 59380,
} as const

const Presale_types: ABIType[] = [
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
    {"name":"Claim","header":1129070921,"fields":[{"name":"query_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"BuyAbi","header":1112889602,"fields":[{"name":"ref","type":{"kind":"simple","type":"address","optional":true}}]},
    {"name":"Withdraw","header":1464423496,"fields":[{"name":"amount","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"WithdrawJettons","header":1464489038,"fields":[{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"amount","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"query_id","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"SetJettonWallet","header":3101903737,"fields":[{"name":"wallet","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"ResolvePending","header":2390954843,"fields":[{"name":"user","type":{"kind":"simple","type":"address","optional":false}},{"name":"action","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"CancelPending","header":4129785881,"fields":[]},
    {"name":"JettonTransferNotification","header":1935855772,"fields":[{"name":"query_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"forward_payload","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"JettonExcesses","header":3576854235,"fields":[{"name":"query_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"Presale$Data","header":null,"fields":[{"name":"owner_","type":{"kind":"simple","type":"address","optional":false}},{"name":"jettonMaster_","type":{"kind":"simple","type":"address","optional":false}},{"name":"jettonWallet_","type":{"kind":"simple","type":"address","optional":true}},{"name":"totalSoldNano_","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"totalRaisedNano_","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"currentRound_","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"currentRoundSoldNano_","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"claimableBuyer_","type":{"kind":"dict","key":"address","value":"int"}},{"name":"claimableReferral_","type":{"kind":"dict","key":"address","value":"int"}},{"name":"creditedBuyer_","type":{"kind":"dict","key":"address","value":"int"}},{"name":"creditedRef_","type":{"kind":"dict","key":"address","value":"int"}},{"name":"claimedBuyer_","type":{"kind":"dict","key":"address","value":"int"}},{"name":"claimedRef_","type":{"kind":"dict","key":"address","value":"int"}},{"name":"pendingTotal_","type":{"kind":"dict","key":"address","value":"int"}},{"name":"pendingBuyer_","type":{"kind":"dict","key":"address","value":"int"}},{"name":"pendingReferral_","type":{"kind":"dict","key":"address","value":"int"}},{"name":"pendingUntil_","type":{"kind":"dict","key":"address","value":"int"}},{"name":"pendingQid_","type":{"kind":"dict","key":"address","value":"int"}},{"name":"nextQid_","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"userByQid_","type":{"kind":"dict","key":"int","value":"address"}},{"name":"totalClaimableNano_","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"totalPendingNano_","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
]

const Presale_opcodes = {
    "Deploy": 2490013878,
    "DeployOk": 2952335191,
    "FactoryDeploy": 1829761339,
    "Claim": 1129070921,
    "BuyAbi": 1112889602,
    "Withdraw": 1464423496,
    "WithdrawJettons": 1464489038,
    "SetJettonWallet": 3101903737,
    "ResolvePending": 2390954843,
    "CancelPending": 4129785881,
    "JettonTransferNotification": 1935855772,
    "JettonExcesses": 3576854235,
}

const Presale_getters: ABIGetter[] = [
    {"name":"codeVersion","methodId":93886,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"ownerGetter","methodId":111277,"arguments":[],"returnType":{"kind":"simple","type":"address","optional":false}},
    {"name":"jettonMasterGetter","methodId":128408,"arguments":[],"returnType":{"kind":"simple","type":"address","optional":false}},
    {"name":"totalSoldNano","methodId":93218,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"totalRaisedNano","methodId":97290,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"currentRound","methodId":66703,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"currentRoundSoldNano","methodId":66895,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"jettonWalletSet","methodId":109247,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"jettonWallet","methodId":90133,"arguments":[],"returnType":{"kind":"simple","type":"address","optional":true}},
    {"name":"claimableBuyerNano","methodId":83027,"arguments":[{"name":"addr","type":{"kind":"simple","type":"address","optional":false}}],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"claimableReferralNano","methodId":77155,"arguments":[{"name":"addr","type":{"kind":"simple","type":"address","optional":false}}],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"totalClaimableNano","methodId":65800,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"totalPendingNano","methodId":124626,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"roundCapNanoGetter","methodId":74558,"arguments":[{"name":"round","type":{"kind":"simple","type":"int","optional":false,"format":257}}],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"roundPriceNanoGetter","methodId":110907,"arguments":[{"name":"round","type":{"kind":"simple","type":"int","optional":false,"format":257}}],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"isPendingGetter","methodId":87232,"arguments":[{"name":"addr","type":{"kind":"simple","type":"address","optional":false}}],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"pendingUntilGetter","methodId":123979,"arguments":[{"name":"addr","type":{"kind":"simple","type":"address","optional":false}}],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"pendingQidGetter","methodId":127484,"arguments":[{"name":"addr","type":{"kind":"simple","type":"address","optional":false}}],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
]

export const Presale_getterMapping: { [key: string]: string } = {
    'codeVersion': 'getCodeVersion',
    'ownerGetter': 'getOwnerGetter',
    'jettonMasterGetter': 'getJettonMasterGetter',
    'totalSoldNano': 'getTotalSoldNano',
    'totalRaisedNano': 'getTotalRaisedNano',
    'currentRound': 'getCurrentRound',
    'currentRoundSoldNano': 'getCurrentRoundSoldNano',
    'jettonWalletSet': 'getJettonWalletSet',
    'jettonWallet': 'getJettonWallet',
    'claimableBuyerNano': 'getClaimableBuyerNano',
    'claimableReferralNano': 'getClaimableReferralNano',
    'totalClaimableNano': 'getTotalClaimableNano',
    'totalPendingNano': 'getTotalPendingNano',
    'roundCapNanoGetter': 'getRoundCapNanoGetter',
    'roundPriceNanoGetter': 'getRoundPriceNanoGetter',
    'isPendingGetter': 'getIsPendingGetter',
    'pendingUntilGetter': 'getPendingUntilGetter',
    'pendingQidGetter': 'getPendingQidGetter',
}

const Presale_receivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"typed","type":"SetJettonWallet"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Withdraw"}},
    {"receiver":"internal","message":{"kind":"typed","type":"WithdrawJettons"}},
    {"receiver":"internal","message":{"kind":"typed","type":"ResolvePending"}},
    {"receiver":"internal","message":{"kind":"empty"}},
    {"receiver":"internal","message":{"kind":"typed","type":"BuyAbi"}},
    {"receiver":"internal","message":{"kind":"any"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Claim"}},
    {"receiver":"internal","message":{"kind":"typed","type":"CancelPending"}},
    {"receiver":"internal","message":{"kind":"typed","type":"JettonTransferNotification"}},
    {"receiver":"internal","message":{"kind":"typed","type":"JettonExcesses"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Deploy"}},
]


export class Presale implements Contract {
    
    public static readonly CODE_VERSION = 13n;
    public static readonly OP_JETTON_TRANSFER = 260734629n;
    public static readonly OP_BUY_MANUAL = 1112889601n;
    public static readonly BUYER_BONUS_PPM = 50000n;
    public static readonly REF_POOL_BONUS_PPM = 50000n;
    public static readonly JETTON_WALLET_CALL_VALUE = 600000000n;
    public static readonly FORWARD_TON_TO_CLAIMER = 10000000n;
    public static readonly WITHDRAW_MIN_KEEP_TON = 2000000000n;
    public static readonly WITHDRAW_GAS_BUFFER = 120000000n;
    public static readonly CLAIM_TTL_SEC = 180n;
    public static readonly MIN_CLAIM_ATTACHED_TON = 700000000n;
    public static readonly CLAIM_KEEP_TON = 900000000n;
    public static readonly MIN_REFUND_NANO = 10000000n;
    public static readonly NANO_JETTON = 1000000000n;
    public static readonly MAX_ROUND = 19n;
    public static readonly U64_MOD = 18446744073709551616n;
    public static readonly storageReserve = 0n;
    public static readonly errors = Presale_errors_backward;
    public static readonly opcodes = Presale_opcodes;
    
    static async init(owner: Address, jettonMaster: Address) {
        return await Presale_init(owner, jettonMaster);
    }
    
    static async fromInit(owner: Address, jettonMaster: Address) {
        const __gen_init = await Presale_init(owner, jettonMaster);
        const address = contractAddress(0, __gen_init);
        return new Presale(address, __gen_init);
    }
    
    static fromAddress(address: Address) {
        return new Presale(address);
    }
    
    readonly address: Address; 
    readonly init?: { code: Cell, data: Cell };
    readonly abi: ContractABI = {
        types:  Presale_types,
        getters: Presale_getters,
        receivers: Presale_receivers,
        errors: Presale_errors,
    };
    
    constructor(address: Address, init?: { code: Cell, data: Cell }) {
        this.address = address;
        this.init = init;
    }
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: SetJettonWallet | Withdraw | WithdrawJettons | ResolvePending | null | BuyAbi | Slice | Claim | CancelPending | JettonTransferNotification | JettonExcesses | Deploy) {
        
        let body: Cell | null = null;
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'SetJettonWallet') {
            body = beginCell().store(storeSetJettonWallet(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Withdraw') {
            body = beginCell().store(storeWithdraw(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'WithdrawJettons') {
            body = beginCell().store(storeWithdrawJettons(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'ResolvePending') {
            body = beginCell().store(storeResolvePending(message)).endCell();
        }
        if (message === null) {
            body = new Cell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'BuyAbi') {
            body = beginCell().store(storeBuyAbi(message)).endCell();
        }
        if (message && typeof message === 'object' && message instanceof Slice) {
            body = message.asCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Claim') {
            body = beginCell().store(storeClaim(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'CancelPending') {
            body = beginCell().store(storeCancelPending(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'JettonTransferNotification') {
            body = beginCell().store(storeJettonTransferNotification(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'JettonExcesses') {
            body = beginCell().store(storeJettonExcesses(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Deploy') {
            body = beginCell().store(storeDeploy(message)).endCell();
        }
        if (body === null) { throw new Error('Invalid message type'); }
        
        await provider.internal(via, { ...args, body: body });
        
    }
    
    async getCodeVersion(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('codeVersion', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getOwnerGetter(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('ownerGetter', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
    
    async getJettonMasterGetter(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('jettonMasterGetter', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
    
    async getTotalSoldNano(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('totalSoldNano', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getTotalRaisedNano(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('totalRaisedNano', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getCurrentRound(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('currentRound', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getCurrentRoundSoldNano(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('currentRoundSoldNano', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getJettonWalletSet(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('jettonWalletSet', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getJettonWallet(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('jettonWallet', builder.build())).stack;
        const result = source.readAddressOpt();
        return result;
    }
    
    async getClaimableBuyerNano(provider: ContractProvider, addr: Address) {
        const builder = new TupleBuilder();
        builder.writeAddress(addr);
        const source = (await provider.get('claimableBuyerNano', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getClaimableReferralNano(provider: ContractProvider, addr: Address) {
        const builder = new TupleBuilder();
        builder.writeAddress(addr);
        const source = (await provider.get('claimableReferralNano', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getTotalClaimableNano(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('totalClaimableNano', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getTotalPendingNano(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('totalPendingNano', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getRoundCapNanoGetter(provider: ContractProvider, round: bigint) {
        const builder = new TupleBuilder();
        builder.writeNumber(round);
        const source = (await provider.get('roundCapNanoGetter', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getRoundPriceNanoGetter(provider: ContractProvider, round: bigint) {
        const builder = new TupleBuilder();
        builder.writeNumber(round);
        const source = (await provider.get('roundPriceNanoGetter', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getIsPendingGetter(provider: ContractProvider, addr: Address) {
        const builder = new TupleBuilder();
        builder.writeAddress(addr);
        const source = (await provider.get('isPendingGetter', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getPendingUntilGetter(provider: ContractProvider, addr: Address) {
        const builder = new TupleBuilder();
        builder.writeAddress(addr);
        const source = (await provider.get('pendingUntilGetter', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getPendingQidGetter(provider: ContractProvider, addr: Address) {
        const builder = new TupleBuilder();
        builder.writeAddress(addr);
        const source = (await provider.get('pendingQidGetter', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
}