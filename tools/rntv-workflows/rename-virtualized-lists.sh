#!/bin/bash

sed -i '' 's/\@react-native\/virtualized/@react-native-tvos\/virtualized/;' ./packages/react-native/package.json
sed -i '' 's/\@react-native\/virtualized/@react-native-tvos\/virtualized/;' ./packages/virtualized-lists/package.json

