/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.jni.HybridClassBase
import com.facebook.proguard.annotations.DoNotStrip
import java.nio.ByteBuffer

/**
 * A fixed-length byte buffer for TurboModule `ArrayBuffer` arguments and return values.
 *
 * @property isOwningBytes:
 * - `true` — safe to retain and return to JS. Synchronize externally if JS may touch the same
 *   memory concurrently.
 * - `false` — bytes are borrowed from a JS `ArrayBuffer` for the current synchronous call only.
 *   Copy with [arrayBufferWithCopiedBytes] to keep them.
 */
@DoNotStrip
public class ArrayBuffer : HybridClassBase {

  private val buffer: ByteBuffer

  /** Whether this buffer owns its bytes. See the class documentation. */
  public val isOwningBytes: Boolean

  @DoNotStrip
  private constructor(buffer: ByteBuffer, isOwningBytes: Boolean) : super() {
    this.buffer = buffer
    this.isOwningBytes = isOwningBytes
  }

  /** @param size number of zero-filled bytes to allocate */
  public constructor(size: Int) : this(allocateDirect(size), true) {
    initHybrid(buffer, isOwningBytes)
  }

  public val bytes: ByteBuffer
    get() = buffer

  public val size: Int
    get() = buffer.capacity()

  private external fun initHybrid(buffer: ByteBuffer, isOwningBytes: Boolean)

  public companion object {
    init {
      ReactNativeJniCommonSoLoader.staticInit()
    }

    /** @param size number of zero-filled bytes to allocate. Same as `ArrayBuffer(size)`. */
    @JvmStatic
    @DoNotStrip
    public fun arrayBufferWithLength(size: Int): ArrayBuffer = ArrayBuffer(size)

    /** @param bytes copied into a new owning buffer */
    @JvmStatic
    @DoNotStrip
    public fun arrayBufferWithCopiedBytes(bytes: ByteArray): ArrayBuffer {
      val buffer = ArrayBuffer(bytes.size)
      if (bytes.isNotEmpty()) {
        buffer.bytes.put(bytes)
        buffer.bytes.rewind()
      }
      return buffer
    }

    /** @param source remaining bytes are copied into a new owning buffer */
    @JvmStatic
    @DoNotStrip
    public fun arrayBufferWithCopiedBytes(source: ByteBuffer): ArrayBuffer {
      val length = source.remaining()
      val buffer = ArrayBuffer(length)
      if (length > 0) {
        buffer.bytes.put(source.duplicate())
        buffer.bytes.rewind()
      }
      return buffer
    }

    /**
     * @param source copied into a new owning buffer. Use to keep bytes from a non-owning argument
     *   after the call returns.
     */
    @JvmStatic
    @DoNotStrip
    public fun arrayBufferWithCopiedBytes(source: ArrayBuffer): ArrayBuffer {
      val length = source.size
      val buffer = ArrayBuffer(length)
      if (length > 0) {
        val src = source.bytes.duplicate()
        src.position(0)
        src.limit(length)
        buffer.bytes.put(src)
        buffer.bytes.rewind()
      }
      return buffer
    }

    /**
     * @param buffer direct [ByteBuffer] to alias without copying. The caller must keep it valid for
     *   as long as this [ArrayBuffer] lives.
     */
    @JvmStatic
    @DoNotStrip
    public fun arrayBufferWithOwnedBytes(buffer: ByteBuffer): ArrayBuffer {
      require(buffer.isDirect) { "arrayBufferWithOwnedBytes requires a direct ByteBuffer" }
      return ArrayBuffer(buffer, true).apply { initHybrid(buffer, isOwningBytes) }
    }

    private fun allocateDirect(size: Int): ByteBuffer {
      require(size >= 0) { "ArrayBuffer size must not be negative, got $size" }
      return ByteBuffer.allocateDirect(size)
    }
  }
}
