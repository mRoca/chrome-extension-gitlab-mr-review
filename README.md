# Chrome extension : Gitlab CE merge requests review

## The problem

In big project, it's very difficult to see wich merge requests we have already commented or approved.

## The solution

A chrome/chromium extension to quickly see which merge request I've commented or approved. Like this :

![Extension preview](./preview.png)

The red icons are the ones I've commented or approved.

## Usage

```bash
git clone git@github.com:mRoca/chrome-extension-gitlab-mr-review.git
```
Then go to `chrome://extensions/` , use the `Load unpacked extension...` button and select the cloned folder.

## Tech

* This extension works with Gitlab api v4 (`GitLab >= 8.9`).
* This extension only works with Gitlab CE : the approvals system of the EE is not used for now.
