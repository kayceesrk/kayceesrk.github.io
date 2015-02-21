#!/bin/bash

mv Gemfile Gemfile.bak
jekyll serve
mv Gemfile.bak Gemfile
