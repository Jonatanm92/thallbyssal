cmake_minimum_required(VERSION 3.22)

project(ThallbyssalAudio VERSION 0.1.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)

FetchContent_Declare(
  JUCE
  GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
  GIT_TAG 8.0.13
  GIT_SHALLOW TRUE
)

FetchContent_MakeAvailable(JUCE)

option(THALLBYSSAL_ENABLE_NAM_RUNTIME "Enable local/private NeuralAmpModelerCore runtime probe targets" OFF)
set(THALLBYSSAL_NAM_CORE_DIR "D:/CodexBuilds/thallbyssal-nam-runtime-probe/NeuralAmpModelerCore" CACHE PATH "External NeuralAmpModelerCore checkout")

# Opt-in low-latency ASIO support (Windows). Needs the Steinberg ASIO SDK; CI
# downloads it and passes the path in. Off by default so the project builds
# anywhere without the SDK.
option(THALLBYSSAL_ENABLE_ASIO "Build Windows targets with ASIO support" OFF)
set(ASIO_SDK_DIR "" CACHE PATH "Path to the Steinberg ASIO SDK")

set(THALLBYSSAL_DSP_SOURCES
  Source/ThallLabDspEngine.cpp
)

if(THALLBYSSAL_ENABLE_NAM_RUNTIME)
  if(EXISTS "${THALLBYSSAL_NAM_CORE_DIR}/NAM/get_dsp.h")
    file(GLOB_RECURSE THALLBYSSAL_NAM_CORE_SOURCES CONFIGURE_DEPENDS
      "${THALLBYSSAL_NAM_CORE_DIR}/NAM/*.cpp"
      "${THALLBYSSAL_NAM_CORE_DIR}/NAM/*.c"
    )

    add_library(ThallbyssalNamCore OBJECT ${THALLBYSSAL_NAM_CORE_SOURCES})
    target_compile_features(ThallbyssalNamCore PUBLIC cxx_std_20)
    target_include_directories(ThallbyssalNamCore
      PUBLIC
        "${THALLBYSSAL_NAM_CORE_DIR}"
        "${THALLBYSSAL_NAM_CORE_DIR}/Dependencies/eigen"
        "${THALLBYSSAL_NAM_CORE_DIR}/Dependencies/nlohmann"
    )
    target_compile_definitions(ThallbyssalNamCore
      PUBLIC
        NOMINMAX
        WIN32_LEAN_AND_MEAN
        NAM_ENABLE_A2_FAST
    )

    add_library(ThallbyssalNamRuntimeAdapter OBJECT
      Source/NamRuntimeAdapter.cpp
    )
    target_compile_features(ThallbyssalNamRuntimeAdapter PUBLIC cxx_std_20)
    target_include_directories(ThallbyssalNamRuntimeAdapter
      PUBLIC
        "${CMAKE_CURRENT_SOURCE_DIR}/Source"
      PRIVATE
        "${THALLBYSSAL_NAM_CORE_DIR}"
        "${THALLBYSSAL_NAM_CORE_DIR}/Dependencies/eigen"
        "${THALLBYSSAL_NAM_CORE_DIR}/Dependencies/nlohmann"
    )
    target_compile_definitions(ThallbyssalNamRuntimeAdapter
      PUBLIC
        THALLBYSSAL_HAS_NAM_RUNTIME=1
    )

    add_executable(ThallbyssalNamRuntimeProbe
      Source/NamRuntimeProbeMain.cpp
    )
    target_compile_features(ThallbyssalNamRuntimeProbe PRIVATE cxx_std_20)
    target_link_libraries(ThallbyssalNamRuntimeProbe
      PRIVATE
        ThallbyssalNamRuntimeAdapter
        ThallbyssalNamCore
    )

    juce_add_console_app(ThallbyssalLiveV1Probe
      PRODUCT_NAME "Thallbyssal Live V1 Probe"
      COMPANY_NAME "Guitar Workflow Toolkit"
      BUNDLE_ID "local.guitarworkflow.thallbyssal.livev1probe"
    )

    target_sources(ThallbyssalLiveV1Probe
      PRIVATE
        Source/ThallbyssalLiveV1ProbeMain.cpp
        Source/ThallbyssalLiveV1NamChain.cpp
    )

    target_compile_definitions(ThallbyssalLiveV1Probe
      PRIVATE
        JUCE_WEB_BROWSER=0
        JUCE_USE_CURL=0
    )

    target_link_libraries(ThallbyssalLiveV1Probe
      PRIVATE
        juce::juce_audio_formats
        juce::juce_dsp
        ThallbyssalNamRuntimeAdapter
        ThallbyssalNamCore
      PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_lto_flags
        juce::juce_recommended_warning_flags
    )
  else()
    message(WARNING "THALLBYSSAL_ENABLE_NAM_RUNTIME is ON, but THALLBYSSAL_NAM_CORE_DIR does not point to NeuralAmpModelerCore: ${THALLBYSSAL_NAM_CORE_DIR}")
  endif()
endif()

juce_add_gui_app(ThallLabAudioEngine
  PRODUCT_NAME "Thall Lab Audio Engine"
  COMPANY_NAME "Guitar Workflow Toolkit"
  BUNDLE_ID "local.guitarworkflow.thalllabaudioengine"
)

juce_add_plugin(Thallbyssal
  COMPANY_NAME "Thallbyssal Audio"
  PRODUCT_NAME "Thallbyssal"
  BUNDLE_ID "audio.thallbyssal.plugin"
  PLUGIN_MANUFACTURER_CODE TByS
  PLUGIN_CODE Tb01
  FORMATS Standalone VST3
  IS_SYNTH FALSE
  NEEDS_MIDI_INPUT FALSE
  NEEDS_MIDI_OUTPUT FALSE
  IS_MIDI_EFFECT FALSE
  COPY_PLUGIN_AFTER_BUILD TRUE
  VST3_AUTO_MANIFEST FALSE
  VST3_CATEGORIES Fx Distortion
)

juce_add_console_app(ThallbyssalOfflineRenderer
  PRODUCT_NAME "Thallbyssal Offline Renderer"
  COMPANY_NAME "Guitar Workflow Toolkit"
  BUNDLE_ID "local.guitarworkflow.thallbyssal.offlinerenderer"
)

target_sources(ThallLabAudioEngine
  PRIVATE
    Source/Main.cpp
    Source/MainComponent.cpp
    ${THALLBYSSAL_DSP_SOURCES}
)

target_sources(Thallbyssal
  PRIVATE
    Source/PluginProcessor.cpp
    ${THALLBYSSAL_DSP_SOURCES}
)

target_sources(ThallbyssalOfflineRenderer
  PRIVATE
    Source/OfflineRendererMain.cpp
    ${THALLBYSSAL_DSP_SOURCES}
)

target_compile_definitions(ThallLabAudioEngine
  PRIVATE
    JUCE_APPLICATION_NAME_STRING="$<TARGET_PROPERTY:ThallLabAudioEngine,JUCE_PRODUCT_NAME>"
    JUCE_APPLICATION_VERSION_STRING="${PROJECT_VERSION}"
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
)

target_compile_definitions(Thallbyssal
  PRIVATE
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_VST3_CAN_REPLACE_VST2=0
)

# ASIO (Windows) — opt-in. Adds the define + SDK include path to the targets
# that open audio devices. No-op unless THALLBYSSAL_ENABLE_ASIO is set with a
# valid ASIO_SDK_DIR.
if(THALLBYSSAL_ENABLE_ASIO AND ASIO_SDK_DIR)
  message(STATUS "Thallbyssal: ASIO enabled, SDK at ${ASIO_SDK_DIR}")
  foreach(asio_target ThallLabAudioEngine Thallbyssal Thallbyssal_Standalone)
    if(TARGET ${asio_target})
      target_compile_definitions(${asio_target} PRIVATE JUCE_ASIO=1)
      target_include_directories(${asio_target} PRIVATE "${ASIO_SDK_DIR}/common")
    endif()
  endforeach()
endif()

target_compile_definitions(ThallbyssalOfflineRenderer
  PRIVATE
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
)

target_link_libraries(ThallLabAudioEngine
  PRIVATE
    juce::juce_audio_formats
    juce::juce_audio_utils
    juce::juce_dsp
    juce::juce_gui_extra
  PUBLIC
    juce::juce_recommended_config_flags
    juce::juce_recommended_lto_flags
    juce::juce_recommended_warning_flags
)

target_link_libraries(Thallbyssal
  PRIVATE
    juce::juce_audio_processors
    juce::juce_audio_utils
    juce::juce_dsp
    juce::juce_gui_extra
  PUBLIC
    juce::juce_recommended_config_flags
    juce::juce_recommended_lto_flags
    juce::juce_recommended_warning_flags
)

target_link_libraries(ThallbyssalOfflineRenderer
  PRIVATE
    juce::juce_audio_formats
    juce::juce_dsp
  PUBLIC
    juce::juce_recommended_config_flags
    juce::juce_recommended_lto_flags
    juce::juce_recommended_warning_flags
)
