#include "NamRuntimeAdapter.h"

#include <cstdlib>
#include <filesystem>
#include <iostream>
#include <string>

namespace
{
constexpr double kProbeSampleRate = 48000.0;
constexpr int kProbeBlockSize = 64;

void printUsage(const char* executable)
{
  std::cerr << "Usage: " << executable << " <local-private-model.nam>\n";
}
} // namespace

int main(int argc, char* argv[])
{
  if (argc != 2)
  {
    printUsage(argv[0]);
    return 2;
  }

  const std::filesystem::path modelPath(argv[1]);
  thallbyssal::NamRuntimeAdapter adapter;

  if (!adapter.isAvailable())
  {
    std::cerr << "NAM runtime unavailable: " << adapter.lastError() << "\n";
    return 3;
  }

  if (!adapter.loadModel(modelPath))
  {
    std::cerr << "NAM model load failed: " << adapter.lastError() << "\n";
    return 4;
  }

  std::cout << "NAM model loaded\n";
  std::cout << "Expected sample rate: " << adapter.expectedSampleRate() << "\n";
  std::cout << "Input channels: " << adapter.inputChannels() << "\n";
  std::cout << "Output channels: " << adapter.outputChannels() << "\n";

  if (!adapter.prepare(kProbeSampleRate, kProbeBlockSize))
  {
    std::cerr << "NAM prepare failed: " << adapter.lastError() << "\n";
    return 5;
  }

  std::cout << "NAM runtime prepared at " << kProbeSampleRate << " Hz, block " << kProbeBlockSize << "\n";

  if (!adapter.runGeneratedBufferSanityCheck(kProbeBlockSize))
  {
    std::cerr << "NAM generated-buffer sanity check failed: " << adapter.lastError() << "\n";
    return 6;
  }

  std::cout << "NAM generated-buffer sanity check passed\n";
  return 0;
}
