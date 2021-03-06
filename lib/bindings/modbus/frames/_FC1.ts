/// Ext-Port Utils
import { Maybe } from '../../../utils/maybe';
import { Bytes } from '../../../stdint/bytes';

/// Ext-Port Imports
import { Codec } from '../../../codec';
import { bool_t } from '../../../stdint';

/// Modbus Utils
import { BufferUtils } from '../utils/buffer';
import { ModbusError } from '../utils/error';

/// Modbus Imports
import { Protocol } from '../protocol';
import { Direction, Generic } from './abstract';

/**************
 *  TYPEDEFS  *
 **************/

/** Read Coils - Arguments Interface. */
export interface IReadCoils {
    request: { start: number; quantity: number };
    response: { status: bool_t[] };
}

/********************
 *  IMPLEMENTATION  *
 ********************/

/** Read Coils - Frame */
export namespace FC1 {
    /************
     *  FRAMES  *
     ************/

    /** `FC1` Implementation. */
    export class Frame<K extends Direction> extends Generic<'read-coils', K> {
        /**
         * Constructs a FC1 frame with the given arguments.
         * @param kind                      Frame Direction.
         * @param args                      Arguments to Encode.
         */
        constructor(kind: K, public readonly args: IReadCoils[K]) {
            // inherit from the base generic frame
            super((kind === 'request' ? new Request() : new Response()) as any, 'read-coils', kind);
        }
    }

    /***********
     *  CODEC  *
     ***********/

    /** `FC1` Request Codec. */
    export class Request extends Codec.Abstract<Protocol.Simplex<'request'>> {
        /**
         * Encodes a request frame.
         * @param frame                 Frame to encode.
         */
        encode(frame: Frame<'request'>): Maybe.IPerhaps<Buffer> {
            const { start, quantity } = frame.args;
            const payload = Buffer.alloc(5);
            payload.writeUint8(frame.code, 0);
            payload.writeUint16BE(start, 1);
            payload.writeUint16BE(quantity, 3);
            return Maybe.Some(payload);
        }

        /**
         * Decodes a request frame buffer.
         * @param buffer                Buffer to attempt decoding.
         * @param encoding              Optional encoding.
         */
        decode(buffer: Buffer, encoding?: BufferEncoding): Maybe.IPerhaps<Frame<'request'>> {
            return BufferUtils.safeAccess(Maybe.None(), () => {
                const code = buffer.readUint8(0);
                Generic.assertCode(code, 1, 'request');
                const start = buffer.readUint16BE(1);
                const quantity = buffer.readUint16BE(3);
                return Maybe.Some(new Frame('request', { start, quantity }));
            });
        }
    }

    /** `FC1` Response Codec. */
    export class Response extends Codec.Abstract<Protocol.Simplex<'response'>> {
        /**
         * Encodes a request frame.
         * @param frame                 Frame to encode.
         */
        encode(frame: Frame<'response'>): Maybe.IPerhaps<Buffer> {
            const { status } = frame.args;
            const sbuf = Bytes.from('bool', status);
            const payload = Buffer.alloc(sbuf.length + 2);
            payload.writeUint8(frame.code, 0);
            payload.writeUint8(sbuf.length, 1);
            sbuf.copy(payload, 2);
            return Maybe.Some(payload);
        }

        /**
         * Decodes a request frame buffer.
         * @param buffer                Buffer to attempt decoding.
         * @param encoding              Optional encoding.
         */
        decode(buffer: Buffer, encoding?: BufferEncoding): Maybe.IPerhaps<Frame<'response'>> {
            return BufferUtils.safeAccess(Maybe.None(), () => {
                const code = buffer.readUint8(0);
                const count = buffer.readUint8(1);
                const sbuf = buffer.slice(2, 2 + count);

                Generic.assertCode(code, 1, 'response');
                if (sbuf.length !== count) throw ModbusError('FC1 mismatched status buffer length');

                const status = Bytes.to('bool', sbuf);
                return Maybe.Some(new Frame('response', { status }));
            });
        }
    }
}
