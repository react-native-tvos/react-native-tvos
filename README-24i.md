
# React-native-tvos fork made by 24i


## How to handle making a change here

1. First make sure you have read this documentation before doing anything else

2. Then make sure there is no other way to fix this issue. Making a change here should be the last option. Have a discussion with some collagues. Maybe others have some alternative options in mind.

3. When you are sure a change here is the way to go, do a change using a feature branch. **Make sure to describe that change here on this file below in the section Changes**.

4. Make a PR to merge it on **24i-fork-branch** branch. Take special care when making a PR to setup merge correctly as by default it attempts to merge with upstream repo (react-native-tvos/react-native-tvos). Ask some collagues to review the PR.

5. When PR gets merged, from branch **24i-fork-branch** take the latest commit hash and copy it to prd-nxg-smartapps repo where react-native-tvos npm package is being used. Dependency is expressed using `github:24i/react-native-tvos#<HASH HERE>`.


## Changes:

React/Views/RCTTVView.m

- Negated vertical tiltAngle value in order to fix https://jira.24i.com/browse/PRDSAPPSTV-398