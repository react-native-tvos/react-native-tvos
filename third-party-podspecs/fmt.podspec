Pod::Spec.new do |spec|
  spec.name = 'fmt'
  spec.version = '7.1.3'
  spec.license = { :type => 'MIT' }
  spec.homepage = 'http://github.com/fmtlib/fmt'
  spec.summary = '{fmt} is an open-source formatting library for C++. It can be used as a safe and fast alternative to (s)printf and iostreams.'
  spec.authors = { "The fmt contributors": "https://github.com/fmtlib/fmt/issues" }
  spec.source = { :git => 'https://github.com/fmtlib/fmt.git', :tag => '7.1.3' }

  # Pinning to the same version as React.podspec.
  spec.platforms = { :ios => '11.0', :tvos => '11.0', :osx => '10.14' }
  spec.libraries = 'c++'
  spec.public_header_files = 'include/fmt/*.h'
  spec.header_mappings_dir = 'include'
  spec.source_files = 'src/*.cc',
                      'include/fmt/*.h'
  spec.exclude_files = 'src/os.cc'
  spec.pod_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => "${PODS_TARGET_SRCROOT}/include",
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++14",
    "USE_HEADERMAP" => "NO",
    "ALWAYS_SEARCH_USER_PATHS" => "NO"
  }
end
