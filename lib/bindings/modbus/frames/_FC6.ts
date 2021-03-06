/// Ext-Port Utils
import { Maybe } from '../../../utils/maybe';
import { Bytes } from '../../../stdint/bytes';

/// Ext-Port Imports
import { Codec } from '../../../codec';
import { uint16_t } from '../../../stdint';

/// Modbus Utils
import { BufferUtils } from '../utils/buffer';

/// Modbus Imports
import { Protocol } from '../protocol';
import { Direction, Generic } from './abstract';

/**************
 *  TYPEDEFS  *
 **************/

/** Write Single Register - Arguments Interface. */
export interface IWriteSingleRegister {
    request: { start: number; value: uint16_t };
    response: { address: number; value: uint16_t };
}

/********************
 *  IMPLEMENTATION  *
 ********************/

/** Write Single Register - Frame. */
export namespace FC6 {
    /************
     *  FRAMES  *
     ************/

    /** `FC6` Implementation. */
    export class Frame<K extends Direction> extends Generic<'write-single-register', K> {
        /**
         * Constructs a FC6 frame with the given arguments.
         * @param kind                      Frame Direction.
         * @param args                      Arguments to Encode.
         */
        constructor(kind: K, public readonly args: IWriteSingleRegister[K]) {
            // inherit from the base generic frame
            super((kind === 'request' ? new Request() : new Response()) as any, 'write-single-register', kind);
        }
    }

    /***********
     *  CODEC  *
     ***********/

    /** `FC6` Request Codec. */
    export class Request extends Codec.Abstract<Protocol.Simplex<'request'>> {
        /**
         * Encodes a request frame.
         * @param frame                 Frame to encode.
         */
        encode(frame: Frame<'request'>): Maybe.IPerhaps<Buffer> {
            const { start, value } = frame.args;
            const payload = Buffer.alloc(5);
            payload.writeUint8(frame.code, 0);
            payload.writeUint16BE(start, 1);
            payload.writeUint16BE(value, 3);
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
                const start = buffer.readUint16BE(1);
                const value = buffer.readUint16BE(3) as uint16_t;
                Generic.assertCode(code, 6, 'request');
                return Maybe.Some(new Frame('request', { start, value }));
            });
        }
    }

    /** `FC6` Response Codec. */
    export class Response extends Codec.Abstract<Protocol.Simplex<'response'>> {
        /**
         * Encodes a request frame.
         * @param frame                 Frame to encode.
         */
        encode(frame: Frame<'response'>): Maybe.IPerhaps<Buffer> {
            const { address, value } = frame.args;
            const payload = Buffer.alloc(5);
            payload.writeUInt8(frame.code, 0);
            payload.writeUint16BE(address, 1);
            payload.writeUint16BE(value, 3);
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
                const address = buffer.readUint16BE(1);
                const value = buffer.readUint16BE(3) as uint16_t;
                Generic.assertCode(code, 6, 'response');
                return Maybe.Some(new Frame('response', { address, value }));
            });
        }
    }
}
