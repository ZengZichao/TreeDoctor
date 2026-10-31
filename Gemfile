source "https://rubygems.org"

# Use the github-pages gem which bundles Jekyll and all supported plugins
gem "github-pages", group: :jekyll_plugins

# Additional plugins (not bundled in github-pages)
group :jekyll_plugins do
  gem "jekyll-seo-tag"
  gem "jekyll-sitemap"
end

# Windows / JRuby compatibility
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]
