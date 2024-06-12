
# react-native-tvos - 24i fork

## Using this package in a project/product

Use `https://github.com/24i/react-native-tvos.git#<TAG>` as a dependency. So for example:

```
"react-native-tvos": "https://github.com/24i/react-native-tvos.git#24i-v0.63.4-3"
```

It's very important you define it exactly like that. At least yarn have some bugs which are causing problems with using git references as npm dependency. See https://github.com/yarnpkg/yarn/issues/4722.

## Rules

1. Read this documentation.

2. Think, don't do things in hurry.

3. Modify code on this repo as a last option. Talk to at least one collegue before doing anything on this repo.

4. If you absolutely need to make a change, touch as little code as possible.


## Steps to apply a change

1. Make a feature branch using **24i-fork-branch** as a base.

2. Do the required change with as little code as possible. Describe all changes you do below in a section "List of changes".

3. Make a PR to merge it into **24i-fork-branch**. Take a special care when making a PR to setup a merge correctly. By default it attempts to merge with upstream repo (react-native-tvos/react-native-tvos). Ask some collagues to review the PR.

4. After PR has been merged look for the latest commit on **24i-fork-branch**. Copy the hash of it and use it as a dependency in prd-nxg-smartapps repo where react-native-tvos package is being used. Dependency is expressed using `github:24i/react-native-tvos#<HASH HERE>`.

6. (Optional) Consider making a PR on upstream repo as well.


## List of changes:

It's important to list all changes we have done in order to keep track of them and allow easier migration when updating the library.

### ./README-24i.md

- Created the file

### ./React/Views/RCTTVView.m

- Negated vertical tiltAngle value in order to fix https://jira.24i.com/browse/PRDSAPPSTV-398 ([link to PR](https://github.com/24i/react-native-tvos/pull/1))


### ./React/Base/RCTTVRemoteHandler.h

- Adding long press events for arrow keys in order to support https://jira.24i.com/browse/PRDPLAYER-1152 ([link to PR](https://github.com/24i/react-native-tvos/pull/2))

### ./React/Base/RCTTVRemoteHandler.m

- Adding long press events for arrow keys in order to support https://jira.24i.com/browse/PRDPLAYER-1152 ([link to PR](https://github.com/24i/react-native-tvos/pull/2))

### ./tvos-types.d.ts

- Adding long press events for arrow keys in order to support https://jira.24i.com/browse/PRDPLAYER-1152 ([link to PR](https://github.com/24i/react-native-tvos/pull/2))


### ./React/Views/ScrollView/RCTScrollView.m

- Changed how snapping to offset is being calculated. Ticket related https://aferian.atlassian.net/browse/PRDSAPPSTV-675. ([link to PR](https://github.com/24i/react-native-tvos/pull/3))

### ./React/Base/RCTTouchHandler.m

- Changed how touch events are bubbling. It affects swipe. 
This is needed when used in conjuction with "react-native-screens": "3.13.1"
Remove if updating it.
Ticket related https://aferian.atlassian.net/browse/PRDSAPPSTV-751
Ticket related https://aferian.atlassian.net/browse/PRDSAPPSRN-12649
([link to PR](https://github.com/24i/react-native-tvos/pull/5))

### ./ReactCommon/yoga/yoga/Yoga.cpp

- Use of bitwise '|' with boolean operands ([link to PR](https://github.com/24i/react-native-tvos/pull/6))
