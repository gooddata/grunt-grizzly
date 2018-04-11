<p align="center">
  <img src="icon.png"/>
</p>

Grizzly
=======

Simple GoodData proxy server for client development.

## Usage
### CLI
``` 
$ yarn add grunt-grizzly
$ yarn grizzly -h
Usage: grizzly -b [backend] -p [port] -d [document-root]

Options:
  -p, --port            local port to listen on           [default: 8443]
  -h, --help            show this help
  -b, --backend         backend host name                 [default: "secure.gooddata.com"]
  -d, --document-root   document root directory to use
  -s, --stub            stub file or function
  -c, --cert            path cert file
  -k, --key             path to key file
  -a, --autoassignPort  increment port number and if specified port is already in use
```

### Direct with grunt

To run grizzly as a standalone server, the only thing you need to do is to run:

	grunt

from root directory of grunt-grizzly.

### As a grunt task

This module registers `grizzly` grunt task, so you can add

	grunt.task.loadNpmTasks('grunt-grizzly');
	grunt.task.run('grizzly');

to your gruntfile.

## Configuration

`grizzly` task provides following configuration options:

- `backend` host name of proxy endpoint
	Defaults to `secure.gooddata.com`.

- `host` alias of `backend`

- `port` number of local port to listen to.
	Defaults to `8443`

- `root` root directory, relative to project root.
	Default is `base`.

- `dir` alias of `root`

- `cert` path to certificate to use. Defaults to `<grunt-grizzly>/cert/server.crt`.
	You will hardly ever need to change this value.

- `key` path to ssl key to use. Defaults to `<grunt-grizzly>/cert/server.key`.
	You will hardly ever need to change this value.

- `keepAlive` This is **not** an option, it is a **flag!!!**
	If set, e.g. by calling

		grunt.task.run('grizzly:keepAlive');

	then grizzly will not exit after the server has been started. This is useful
	when starting standalone grizzly with no grunt tasks after `grizzly` task.
	If not specified, grunt will execute next task normally.

- `stub` express instance setup function/module that is called with an instance
    of `express` app before setting up the static root directory handler.

   Form: function or path to file that exports a function, i.e.

		module.exports = function(app) {
			// do something with app here
		}

- `quiet` This is **not** an option, it is a **flag!!!**
	If set, grizzly will not produce any output (i.e. will not log anything to console).

## Testing

There are no integration tests so far. Unit tests are stored under `test/unit/cases`
and can be run with `grunt test`. Jasmine is used.
