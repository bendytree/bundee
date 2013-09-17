

# Bundee

Bundee is a JavaScript and CSS bundler designed for simple ExpressJS/NodeJS websites.


## Getting Started

    //Install bundee from NPM
    npm install bundee --save

    //Require bundee when your app starts up
    //This exposes `bundee` to your EJS views
    require('bundee')(app);

    //Use it in your view
    <%- bundee.js('http://cdn.ly/lodash.js', '/js/site.js', '/js/home.js') %>
    <%- bundee.css('http://cdn.ly/bootstrap.css', '/css/site.css') %>


## How It Works

The `bundee.js` call takes a list of paths to JavaScript files. These can be virtual paths to your website or they can be full URLs. In other words, it's exactly the same path you'd put in a `<script src='...'` tag.

During development, `bundee.js(...)` spits out a script tag for each JavaScript file. So our example above would generate:

    <script src="http://cdn.ly/lodash.js" type="text/javascript"></script>
    <script src="/js/libs/site.js" type="text/javascript"></script>
    <script src="/js/libs/home.js" type="text/javascript"></script>

In production mode (where `process.env.ENV_VARIABLE == 'production'`), bundee generates a single script tag that combines and compresses all of the JavaScript files. For example:

    <script src="/bundee/js?{src:...}" type="text/javascript"></script>


## Caching and Versioning

In production mode, bundee caches your combined JavaScript files very aggressively. Ideally your client should never need to load an unchanged bundle more than once.

You might wonder, "If I change of the JavaScript files, won't the clients still be caching the old version?" Bundee does an MD5 checksum of the combined files. So if a single file changes (even in the smallest way), bundee will change the version number it is giving to clients. Now all clients will ignore the old cached bundle and request the new one.

## Scaling

Is bundee right for everyone? Nope. Serving your static content from your application's website is not optimal for sites with significant traffic. If you're looking to maximally optimize your static asset load times, I'd bundle assets as part of a deploy command, host my them on a separate subdomain, and use a company like [Rackspace](http://www.rackspace.com/) to setup a push CDN.

On the other hand, many of us are working on low traffic websites. We are tinkering with concepts for websites, writing blogs for our aunts, or designing software that is used by only a handful of people. We want static assets to load as fast as possible, but we're not looking to host multiple servers. And most of all, we want it to be easy/flexible. That's bundee.


## Options

You can tweak how bundee works by passing in an options parameter. For example, this code would force bundee to bundle scripts/css:

    //Force bundee to work in production mode
    require('bundee')(app, { debug:false });

### Type Specific Options

If you want to set an option like `debug` for both js and css bundles, you would do so like this:

    //Set debug=false for js and css
    require('bundee')(app, { debug:false });

However, you can also set an option for only js or only css by passing a `js` and/or `css` object with its own options. For example:

    //Set debug=false for js and debug=true for css
    require('bundee')(app, {js:{debug:false}, css:{debug:true}});

Bundee will always look for the type specific option (ie js or css), then look to the generic option. If none is found, then bundee will use defaulted options (which work the same way). 

#### debug

`true` or `false`. Defaults to `process.env.ENV_VARIABLE != 'production'`. Controls whether scripts are bundled or not. If debug is false, scripts are always bundled. If true, scripts are never bundled.

#### bundlePath

String. Defaults to `'/bundee/:type?:info'`. The virtual path where bundee will serve scripts from.  `:info` is required and will be replaced by the script information like version, sources, etc. `:type` will be replaced by the type of bundle (css or js).

#### cache

Number of milliseconds. Defaults to one year (365*24*60*60*1000). How long a version of a bundle is cached by the browser. If the contents of the bundle changes, then the version number will change and the cache is ignored.

#### version

String. Defaults to `"v"+(+new Date)`. Since bundee bundles scripts on-demand, the first request for a bundle will not have a version number (because the MD5 has not been calculated). Until the MD5 checksum is calculated, the defaultVersion is used.

#### tag

String. A template for the HTML tag that is generated. `:url` is replaced by the url to the source file. For example, the default for JavaScript tags is `'<script type="text/javascript" src=":url"></script>\n'`.

#### baseUrl

String. Defaults to `"http://127.0.0.1:" + (process.env.PORT || 3000) + "/"`. The url that bundee should use to load local sources from the server. For example, if your source path is `'/js/site.js'` then bundee would load the raw source from `http://127.0.0.1:3000/js/site.js`, then bundle it with the other scripts.

#### prefix

String. Defaults to `"\n\n/**\n * @preserve :url \n */\n"`. A format string used as a header for each file that is bundled. The substring `:url` will be replaced with the source URL used to load the file.

#### suffix

String. Defaults to `"\n\n"`. The same as the `prefix` option, but is added to the end of the source.

#### contentType

String. Defaults to `"application/javascript"` for JavaScript and `"text/css"` for CSS. 

#### formatSrc

Function. Format the source code before it is bundled. For example, `function(src, url){ return src; }` where `src` is the code and `url` is the url to the source. By default, CSS files use this function to fix relative URLs before they are bundled.

#### formatBundle

Function. Format the source code after it is bundled. For example, `function(src){ return src; }` where `src` is the code. By default, JavaScript bundles are compressed within this function.




