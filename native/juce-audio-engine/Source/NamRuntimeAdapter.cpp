#include "NamRuntimeAdapter.h"

#include <algorithm>
#include <cmath>
#include <utility>
#include <vector>

#if THALLBYSSAL_HAS_NAM_RUNTIME
#include "NAM/dsp.h"
#include "NAM/get_dsp.h"
#endif

namespace thallbyssal
{

struct NamRuntimeAdapter::Impl
{
#if THALLBYSSAL_HAS_NAM_RUNTIME
  std::unique_ptr<nam::DSP> model;
  std::vector<std::vector<NAM_SAMPLE>> inputBuffers;
  std::vector<std::vector<NAM_SAMPLE>> outputBuffers;
  std::vector<NAM_SAMPLE*> inputPtrs;
  std::vector<NAM_SAMPLE*> outputPtrs;
#endif
};

NamRuntimeAdapter::NamRuntimeAdapter()
  : impl_(std::make_unique<Impl>())
{
#if !THALLBYSSAL_HAS_NAM_RUNTIME
  setError("NAM runtime adapter was not compiled with THALLBYSSAL_HAS_NAM_RUNTIME.");
#endif
}

NamRuntimeAdapter::~NamRuntimeAdapter() = default;

bool NamRuntimeAdapter::isAvailable() const noexcept
{
#if THALLBYSSAL_HAS_NAM_RUNTIME
  return true;
#else
  return false;
#endif
}

bool NamRuntimeAdapter::isLoaded() const noexcept
{
  return loaded_;
}

bool NamRuntimeAdapter::isPrepared() const noexcept
{
  return prepared_;
}

bool NamRuntimeAdapter::loadModel(const std::filesystem::path& modelPath)
{
  loaded_ = false;
  prepared_ = false;
  expectedSampleRate_ = -1.0;
  inputChannels_ = 0;
  outputChannels_ = 0;

#if THALLBYSSAL_HAS_NAM_RUNTIME
  if (modelPath.empty())
  {
    setError("NAM model path is empty.");
    return false;
  }

  if (!std::filesystem::exists(modelPath))
  {
    setError("NAM model path does not exist: " + modelPath.string());
    return false;
  }

  try
  {
    impl_->model = nam::get_dsp(modelPath);
  }
  catch (const std::exception& exception)
  {
    setError(std::string("NAM model load threw exception: ") + exception.what());
    return false;
  }
  catch (...)
  {
    setError("NAM model load threw an unknown exception.");
    return false;
  }

  if (impl_->model == nullptr)
  {
    setError("NeuralAmpModelerCore returned null while loading NAM model.");
    return false;
  }

  expectedSampleRate_ = impl_->model->GetExpectedSampleRate();
  inputChannels_ = impl_->model->NumInputChannels();
  outputChannels_ = impl_->model->NumOutputChannels();
  loaded_ = true;
  lastError_.clear();
  return true;
#else
  (void) modelPath;
  setError("NAM runtime is unavailable because THALLBYSSAL_HAS_NAM_RUNTIME is not enabled.");
  return false;
#endif
}

bool NamRuntimeAdapter::prepare(double sampleRate, int maxBlockSize)
{
#if THALLBYSSAL_HAS_NAM_RUNTIME
  if (!loaded_ || impl_->model == nullptr)
  {
    setError("Cannot prepare NAM runtime before a model is loaded.");
    return false;
  }

  if (!(sampleRate > 0.0))
  {
    setError("NAM runtime prepare sample rate must be positive.");
    return false;
  }

  if (maxBlockSize <= 0)
  {
    setError("NAM runtime prepare block size must be positive.");
    return false;
  }

  try
  {
    impl_->model->Reset(sampleRate, maxBlockSize);
  }
  catch (const std::exception& exception)
  {
    setError(std::string("NAM runtime prepare threw exception: ") + exception.what());
    return false;
  }
  catch (...)
  {
    setError("NAM runtime prepare threw an unknown exception.");
    return false;
  }

  preparedSampleRate_ = sampleRate;
  preparedBlockSize_ = maxBlockSize;
  inputChannels_ = std::max(1, impl_->model->NumInputChannels());
  outputChannels_ = std::max(1, impl_->model->NumOutputChannels());
  impl_->inputBuffers.assign(static_cast<size_t>(inputChannels_), std::vector<NAM_SAMPLE>(static_cast<size_t>(maxBlockSize), NAM_SAMPLE{}));
  impl_->outputBuffers.assign(static_cast<size_t>(outputChannels_), std::vector<NAM_SAMPLE>(static_cast<size_t>(maxBlockSize), NAM_SAMPLE{}));
  impl_->inputPtrs.resize(static_cast<size_t>(inputChannels_));
  impl_->outputPtrs.resize(static_cast<size_t>(outputChannels_));

  for (int channel = 0; channel < inputChannels_; ++channel)
    impl_->inputPtrs[static_cast<size_t>(channel)] = impl_->inputBuffers[static_cast<size_t>(channel)].data();

  for (int channel = 0; channel < outputChannels_; ++channel)
    impl_->outputPtrs[static_cast<size_t>(channel)] = impl_->outputBuffers[static_cast<size_t>(channel)].data();

  prepared_ = true;
  lastError_.clear();
  return true;
#else
  (void) sampleRate;
  (void) maxBlockSize;
  setError("NAM runtime is unavailable because THALLBYSSAL_HAS_NAM_RUNTIME is not enabled.");
  return false;
#endif
}

bool NamRuntimeAdapter::processBlock(const double* monoInput, double* monoOutput, int numFrames)
{
#if THALLBYSSAL_HAS_NAM_RUNTIME
  if (!prepared_ || impl_->model == nullptr)
  {
    setError("Cannot process NAM runtime before prepare succeeds.");
    return false;
  }

  if (monoInput == nullptr || monoOutput == nullptr)
  {
    setError("NAM runtime process buffers must not be null.");
    return false;
  }

  if (numFrames <= 0 || numFrames > preparedBlockSize_)
  {
    setError("NAM runtime process frame count is outside prepared block size.");
    return false;
  }

  const auto frameCount = static_cast<size_t>(numFrames);

  for (int channel = 0; channel < inputChannels_; ++channel)
  {
    auto& channelBuffer = impl_->inputBuffers[static_cast<size_t>(channel)];
    std::fill(channelBuffer.begin(), channelBuffer.end(), NAM_SAMPLE{});

    for (size_t frame = 0; frame < frameCount; ++frame)
      channelBuffer[frame] = static_cast<NAM_SAMPLE>(monoInput[frame]);
  }

  for (auto& channelBuffer : impl_->outputBuffers)
    std::fill(channelBuffer.begin(), channelBuffer.end(), NAM_SAMPLE{});

  try
  {
    impl_->model->process(impl_->inputPtrs.data(), impl_->outputPtrs.data(), numFrames);
  }
  catch (const std::exception& exception)
  {
    setError(std::string("NAM runtime process threw exception: ") + exception.what());
    return false;
  }
  catch (...)
  {
    setError("NAM runtime process threw an unknown exception.");
    return false;
  }

  const auto& firstOutput = impl_->outputBuffers.front();
  for (size_t frame = 0; frame < frameCount; ++frame)
  {
    monoOutput[frame] = static_cast<double>(firstOutput[frame]);
    if (!std::isfinite(monoOutput[frame]))
    {
      setError("NAM runtime process produced a non-finite sample.");
      return false;
    }
  }

  lastError_.clear();
  return true;
#else
  (void) monoInput;
  (void) monoOutput;
  (void) numFrames;
  setError("NAM runtime is unavailable because THALLBYSSAL_HAS_NAM_RUNTIME is not enabled.");
  return false;
#endif
}

bool NamRuntimeAdapter::runGeneratedBufferSanityCheck(int numFrames)
{
  if (numFrames <= 0)
  {
    setError("Generated NAM runtime sanity check frame count must be positive.");
    return false;
  }

  std::vector<double> input(static_cast<size_t>(numFrames), 0.0);
  std::vector<double> output(static_cast<size_t>(numFrames), 0.0);

  for (int frame = 0; frame < numFrames; ++frame)
    input[static_cast<size_t>(frame)] = 0.001 * std::sin(2.0 * 3.14159265358979323846 * static_cast<double>(frame) / 32.0);

  return processBlock(input.data(), output.data(), numFrames);
}

double NamRuntimeAdapter::expectedSampleRate() const noexcept
{
  return expectedSampleRate_;
}

int NamRuntimeAdapter::inputChannels() const noexcept
{
  return inputChannels_;
}

int NamRuntimeAdapter::outputChannels() const noexcept
{
  return outputChannels_;
}

const std::string& NamRuntimeAdapter::lastError() const noexcept
{
  return lastError_;
}

void NamRuntimeAdapter::setError(std::string message)
{
  lastError_ = std::move(message);
}

} // namespace thallbyssal
