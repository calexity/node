// Copyright Joyent, Inc. and other Node contributors.

// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:

// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

/*
 * Test to verify we are using Typed Arrays
 * (http://www.khronos.org/registry/typedarray/specs/latest/) correctly Test to
 * verify Buffer can used in Typed Arrays
 */

var common = require('../common');
var assert = require('assert');
var SlowBuffer = process.binding('buffer').SlowBuffer;
var ArrayBuffer = process.binding('typed_array').ArrayBuffer;
var Int32Array = process.binding('typed_array').Int32Array;
var Int16Array = process.binding('typed_array').Int16Array;
var Uint8Array = process.binding('typed_array').Uint8Array;

// initialize a zero-filled buffer
var buffer = new Buffer(8);
buffer.fill(0);

var uint8 = new Uint8Array(buffer);
var uint16 = new Uint16Array(buffer);
var uint16slice = new Uint16Array(buffer, 2, 2);
var uint32 = new Uint32Array(buffer);

assert.equal(uint8.BYTES_PER_ELEMENT, 1);
assert.equal(uint16.BYTES_PER_ELEMENT, 2);
assert.equal(uint16slice.BYTES_PER_ELEMENT, 2);
assert.equal(uint32.BYTES_PER_ELEMENT, 4);

// now change the underlying buffer
buffer[0] = 0x08;
buffer[1] = 0x09;
buffer[2] = 0x0a;
buffer[3] = 0x0b;
buffer[4] = 0x0c;
buffer[5] = 0x0d;
buffer[6] = 0x0e;
buffer[7] = 0x0f;

/*
  This is what we expect the variables to look like at this point (on
  little-endian machines):

  buffer      | 0x08 | 0x09 | 0x0a | 0x0b | 0x0c | 0x0d | 0x0e | 0x0f |
  uint8       | 0x08 | 0x09 | 0x0a | 0x0b | 0x0c | 0x0d | 0x0e | 0x0f |
  uint16      |    0x0908   |    0x0b0a   |    0x0d0c   |    0x0f0e   |
  uint16slice --------------|    0x0b0a   |    0x0d0c   |--------------
  uint32      |         0x0b0a0908        |         0x0f0e0d0c        |
*/

assert.equal(uint8[0], 0x08);
assert.equal(uint8[1], 0x09);
assert.equal(uint8[2], 0x0a);
assert.equal(uint8[3], 0x0b);
assert.equal(uint8[4], 0x0c);
assert.equal(uint8[5], 0x0d);
assert.equal(uint8[6], 0x0e);
assert.equal(uint8[7], 0x0f);

// determine whether or not typed array values are stored little-endian first
// internally
var IS_LITTLE_ENDIAN = (new Uint16Array([0x1234])).buffer[0] === 0x34;

if (IS_LITTLE_ENDIAN) {
  assert.equal(uint16[0], 0x0908);
  assert.equal(uint16[1], 0x0b0a);
  assert.equal(uint16[2], 0x0d0c);
  assert.equal(uint16[3], 0x0f0e);

  assert.equal(uint16slice[0], 0x0b0a);
  assert.equal(uint16slice[1], 0x0d0c);

  assert.equal(uint32[0], 0x0b0a0908);
  assert.equal(uint32[1], 0x0f0e0d0c);
} else {
  assert.equal(uint16[0], 0x0809);
  assert.equal(uint16[1], 0x0a0b);
  assert.equal(uint16[2], 0x0c0d);
  assert.equal(uint16[3], 0x0e0f);

  assert.equal(uint16slice[0], 0x0a0b);
  assert.equal(uint16slice[1], 0x0c0d);

  assert.equal(uint32[0], 0x08090a0b);
  assert.equal(uint32[1], 0x0c0d0e0f);
}

// test .subarray(begin, end)
var sub = uint8.subarray(2, 4);

assert.ok(sub instanceof Uint8Array);
assert.equal(sub[0], 0x0a);
assert.equal(sub[1], 0x0b);

// modifications of a value in the subarray of `uint8` should propagate to
// the other views
sub[0] = 0x12;
sub[1] = 0x34;

assert.equal(uint8[2], 0x12);
assert.equal(uint8[3], 0x34);

// test .set(index, value), .set(arr, offset) and .get(index)
uint8.set(1, 0x09);
uint8.set([0x0a, 0x0b], 2);

assert.equal(uint8.get(1), 0x09);
assert.equal(uint8.get(2), 0x0a);
assert.equal(uint8.get(3), 0x0b);