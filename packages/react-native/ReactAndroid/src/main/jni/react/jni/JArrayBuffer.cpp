/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JArrayBuffer.h"

#include <cstring>
#include <span>
#include <utility>
#include <vector>

#include "JByteBufferMutableBuffer.h"

namespace facebook::react {

namespace {

// Holds a copy of bytes borrowed from a JS ArrayBuffer.
class OwnedBytesBuffer final : public jsi::MutableBuffer {
 public:
  explicit OwnedBytesBuffer(std::vector<uint8_t> bytes) noexcept
      : bytes_(std::move(bytes)) {}

  size_t size() const override {
    return bytes_.size();
  }

  uint8_t* data() override {
    return bytes_.data();
  }

 private:
  std::vector<uint8_t> bytes_;
};

} // namespace

void JArrayBuffer::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", JArrayBuffer::initHybrid),
  });
}

void JArrayBuffer::initHybrid(
    jni::alias_ref<jhybridobject> jobj,
    jni::alias_ref<jni::JByteBuffer> buffer,
    jboolean owningBytes) {
  setCxxInstance(
      jobj,
      std::make_shared<JByteBufferMutableBuffer>(buffer),
      owningBytes != JNI_FALSE);
}

jni::local_ref<JArrayBuffer::javaobject> JArrayBuffer::create(
    jni::local_ref<jni::JByteBuffer> byteBuffer,
    std::shared_ptr<jsi::MutableBuffer> buffer,
    bool owningBytes) {
  auto cxxPart = std::make_unique<JArrayBuffer>(std::move(buffer), owningBytes);
  auto javaPart = newObjectJavaArgs(byteBuffer, owningBytes);
  setNativePointer(javaPart, std::move(cxxPart));
  return javaPart;
}

jni::local_ref<JArrayBuffer::javaobject> JArrayBuffer::createOwning(
    std::shared_ptr<jsi::MutableBuffer> buffer) {
  // NewDirectByteBuffer rejects a null address, which is what an empty
  // jsi::ArrayBuffer reports, so empty buffers get an allocation of their own.
  if (buffer->size() == 0) {
    return create(jni::JByteBuffer::allocateDirect(0), std::move(buffer), true);
  }

  auto byteBuffer = jni::JByteBuffer::wrapBytes(buffer->data(), buffer->size());
  return create(std::move(byteBuffer), std::move(buffer), true);
}

jni::local_ref<JArrayBuffer::javaobject> JArrayBuffer::createUnowned(
    void* bytes,
    size_t size) {
  // NewDirectByteBuffer rejects a null address, which is what an empty
  // jsi::ArrayBuffer reports, so empty buffers get an allocation of their own.
  auto byteBuffer = size == 0
      ? jni::JByteBuffer::allocateDirect(0)
      : jni::JByteBuffer::wrapBytes(static_cast<uint8_t*>(bytes), size);
  auto buffer = std::make_shared<JByteBufferMutableBuffer>(byteBuffer);
  return create(std::move(byteBuffer), std::move(buffer), false);
}

jni::local_ref<JArrayBuffer::javaobject> JArrayBuffer::createOwned(
    const void* bytes,
    size_t size) {
  auto byteBuffer = jni::JByteBuffer::allocateDirect(static_cast<jint>(size));
  if (size > 0 && bytes != nullptr) {
    // @lint-ignore CLANGSECURITY facebook-security-vulnerable-memcpy
    std::memcpy(byteBuffer->getDirectBytes(), bytes, size);
  }

  auto buffer = std::make_shared<JByteBufferMutableBuffer>(byteBuffer);
  return create(std::move(byteBuffer), std::move(buffer), true);
}

std::shared_ptr<jsi::MutableBuffer> JArrayBuffer::toJSBuffer(
    jni::alias_ref<javaobject> arrayBuffer) {
  auto* self = arrayBuffer->cthis();
  if (self->owningBytes_) {
    return self->buffer_;
  }

  // Borrowed bytes still belong to the inbound JS ArrayBuffer; copy them before
  // handing a new buffer back to JS.
  auto bytes = std::span<uint8_t>(self->buffer_->data(), self->buffer_->size());
  return std::make_shared<OwnedBytesBuffer>(
      std::vector<uint8_t>(bytes.begin(), bytes.end()));
}

} // namespace facebook::react
