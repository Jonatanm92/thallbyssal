cmake_minimum_required(VERSION 3.22)

project(ThallbyssalAudio VERSION 0.1.0 LANGUAGES CXX)

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

set(THALLBYSSAL_DSP_SOURCES
  Source/ThallLabDspEngine.cpp
)

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
    JUCE_ASIO=1
)

target_compile_definitions(Thallbyssal
  PRIVATE
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_ASIO=1
    JUCE_VST3_CAN_REPLACE_VST2=0
)

if(TARGET Thallbyssal_Standalone)
  target_compile_definitions(Thallbyssal_Standalone
    PRIVATE
      JUCE_ASIO=1
  )
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
