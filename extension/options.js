// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function toggle(radioButton) {
  if (window.localStorage == null) {
    alert('Local storage is required for changing providers');
    return;
  }
  window.localStorage.enableRaw = document.getElementById('enable-raw').checked && 'yes' || 'no';
}

function main() {
  if (window.localStorage == null) {
    alert("LocalStorage must be enabled for changing options.");
    document.getElementById('enable-raw').disabled = true;
    return;
  }

  // Default handler is checked. If we've chosen another provider, we must
  // change the checkmark.
  if (window.localStorage.enableRaw)
    document.getElementById('enable-raw').checked = true;
}

document.addEventListener('DOMContentLoaded', function () {
  main();
  document.querySelector('#enable-raw').addEventListener('click', toggle);
});
