#pragma once

#include <filesystem>
#include <memory>
#include <string>

namespace thallbyssal
{

class NamRuntimeAdapter
{
public:
  NamRuntimeAdapter();
  ~NamRuntimeAdapter();

  NamRuntimeAdapter(const NamRuntimeAdapter&) = delete;
  NamRuntimeAdapter& operator=(const NamRuntimeAdapter&) = delete;

  bool isAvailable() const noexcept;
  bool isLoaded() const noexcept;
  bool isPrepared() const noexcept;

  bool loadModel(const std::filesystem::path& modelPath);
  bool prepare(double sampleRate, int maxBlockSize);
  bool processBlock(const double* monoInput, double* monoOutput, int numFrames);
  bool runGeneratedBufferSanityCheck(int numFrames);

  double expectedSampleRate() const noexcept;
  int inputChannels() const noexcept;
  int outputChannels() const noexcept;
  const std::string& lastError() const noexcept;

private:
  struct Impl;

  void setError(std::string message);

  std::unique_ptr<Impl> impl_;
  std::string lastError_;
  double expectedSampleRate_ = -1.0;
  double preparedSampleRate_ = 0.0;
  int preparedBlockSize_ = 0;
  int inputChannels_ = 0;
  int outputChannels_ = 0;
  bool loaded_ = false;
  bool prepared_ = false;
};

} // namespace thallbyssal
