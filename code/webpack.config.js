/*
 * Copyright 2021 Google LLC

 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 *  https://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
 
const path = require('path');
const webpack = require('webpack');
const CONFIG = {
  mode: 'development',

  entry: {
    app: './src/app.js'
  },
  devServer: {
    contentBase: path.join(__dirname, 'src'),
    index: 'index.html'
  },

  plugins: [
    // Read google maps token from environment variable
    new webpack.EnvironmentPlugin(['NODE_ENV', 'DEBUG'])
  ]
};

// This line enables bundling against src in this repo rather than installed module
module.exports = CONFIG;
