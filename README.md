# UGA

A small thing for an unblocked game platform called UGA

> It wasn't my fault I promise

## Building / Publishing

You have 2 options:

### Option 1 - Publish Script

```
# Install dependencies
>  pip install -r requirements.txt
>  scripts/publish.ps1
```

Outputs:
- `dist/UGA.html`
- `dist/index.min.html`

Distribute `dist/UGA.html` to your users  
It will automatically get the latest version of UGA and load it

### Option 2 - Manual Build
```
# Install dependencies
>  pip install -r requirements.txt
>  python scripts/build.py public/index.html

# Optional 'more advanced' version
>  python scripts/build.py public/index.html -o dist/index.min.html -So dist/UGA.html
```

Outputs:
- `public/index.min.html`

Outputs (Advanced):
- `dist/UGA.html`
- `dist/index.min.html`

The -o flag specifies where to output the minified HTML  
The -So flag tells the builder to output a loader file at the specified location

If you create a loader, that is the file you will give to you users

### Updating

Both publish options generate a file `scripts/.jsdelivr.purge`  
This file contains a list of all the JSDelivr links used in the that build  

To update your project instantly without waiting for JSDelivr to clear its cache (Which happens every 24-hours):  
Go to <a href="https://www.jsdelivr.com/tools/purge">www.jsdelivr.com/tools/purge</a>, paste in the provided links, and click "Purge Now". This will ensure that all your JSDelivr links serve the latest content
