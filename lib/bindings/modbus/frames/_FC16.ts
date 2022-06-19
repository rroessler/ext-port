/// Portex Utils
import { Maybe } from '../../../utils/maybe';
import { Bytes } from '../../../stdint/bytes';

/// Portex Imports
import { Codec } from '../../../codec';
import { bool_t, uint16_t } from '../../../stdint';

/// Modbus Utils
import { BufferUtils } from '../utils/buffer';

/// Modbus Imports
import { Protocol } from '../protocol';
import { Direction, Generic } from './abstract';

/**************
 *  TYPEDEFS  *
 **************/

/** Write Multiple Registers - Arguments Interface. */
export interface IWriteMultipleRegisters {
    request: { start: number; values: uint16_t[] };
    response: { address: number; quantity: number };
}

/********************
 *  IMPLEMENTATION  *
 ********************/

/** Write Multiple Registers - Frame. */
export namespace FC16 {
    /************
     *  FRAMES  *
     ************/

    /** `FC16` Implementation. */
    export class Frame<K extends Direction> extends Generic<'write-multiple-registers', K> {
        /**
         * Constructs a FC16 frame with the given arguments.
         * @param kind                      Frame Direction.
         * @param args                      Arguments to Encode.
         */
        constructor(kind: K, public readonly args: IWriteMultipleRegisters[K]) {
            // inherit from the base generic frame
            super((kind === 'request' ? new Request() : new Response()) as any, 'write-multiple-registers', kind);
        }
    }

    /***********
     *  CODEC  *
     ***********/

    /** `FC16` Request Codec. */
    export class Request extends Codec.Abstract<Protocol.Simplex<'request'>> {
        /**
         * Encodes a request frame.
         * @param frame                 Frame to encode.
         */
        encode(frame: Frame<'request'>): Maybe.IPerhaps<Buffer> {
            const { start, values } = frame.args;
            const vbuf = Bytes.from('uint16', values);
            const quantity = values.length;
            const count = 6 + vbuf.length;

            const payload = Buffer.alloc(count);
            payload.writeUint8(frame.code, 0);
            payload.writeUint16BE(start, 1);
            payload.writeUint16BE(quantity, 3);
            payload.writeUint8(vbuf.length, 5);
            vbuf.copy(payload, 6, 0, count);
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
                Generic.assertCode(code, 16, 'request');

                const start = buffer.readUint16BE(1);
                const count = buffer.readUint8(5);
                const vbuf = buffer.slice(6, 6 + count);
                const values = Bytes.to('uint16', vbuf);

                return Maybe.Some(new Frame('request', { start, values }));
            });
        }
    }

    /** `FC16` Response Codec. */
    export class Response extends Codec.Abstract<Protocol.Simplex<'response'>> {
        /**
         * Encodes a request frame.
         * @param frame                 Frame to encode.
         */
        encode(frame: Frame<'response'>): Maybe.IPerhaps<Buffer> {
            const { address, quantity } = frame.args;
            const payload = Buffer.alloc(5);
            payload.writeUint8(frame.code, 0);
            payload.writeUint16BE(address, 1);
            payload.writeUint16BE(quantity, 3);
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
                const quantity = buffer.readUint16BE(3);
                Generic.assertCode(code, 16, 'response');
                return Maybe.Some(new Frame('response', { address, quantity }));
            });
        }
    }
}
