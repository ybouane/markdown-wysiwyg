Description
===========

Markdown-WYSIWYG is an HTML5 custom element that allows you to easily integrate a WYSIWYG editor to a webpage that returns the MarkDown code of the content rather than the HTML output.

The benefit of this approach is that you can directly save the Markdown code to your database which is cleaner than saving the HTML.  
Also, by using a Markdown parser, you can be sure to only output valid and safe HTML code to your clients.  
It saves you the hurdle of having to whitelist HTML tags and attributes where it is very easy to fail and expose yourself to XSS attack.  
Moreover, by limiting the formatting the user can use, you have better control over the styling of the content.

It is recommended to use [MarkDown-It](https://github.com/markdown-it/markdown-it) for rendering the Markdown to HTML across your website, since it is what is used in the WYSIWYG editor.

How to install
==============

```
npm install markdown-wysiwyg
```

How it works
============

It uses HTML5's custom elements to work seamlessly. It depends on [TurnDown](https://github.com/domchristie/turndown) and [MarkDown-It](https://github.com/markdown-it/markdown-it) to convert HTML->Markdown and Markdown->HTML respectively. It supports basic MarkDown:

*   Bold/Italic/StrikeThrough
*   Headings
*   Images
*   Links
*   Lists (ul/ol)
*   Tables
*   Horizontal Rules
*   Blockquotes
*   Code (inline/block)

The editor itself is pretty simple and straightforward to use. It cleans the HTML code to avoid.

````
<markdown-wysiwyg>
# Basic stuff
**Bold** _Italic_ ~~StrikeThrough~~
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

# Lists
Bullet lists:
* Bullet point 1
* Bullet point 2

And numbered lists:
1. Numbered item 1
1. Numbered item 2
1. Numbered item 3

# Links
[Markdown-WYSIWYG](https://github.com/ybouane/markdown-wysiwyg)

# Images
![Google Logo](https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png)

# Tables
| Col 1 | Col 2 | Col 3 |
| --- | --- | --- |
| A | B | C |
| D | E | F |

# Horizontal Rules
* * *

# Blockquotes
> Quote someone deep

# Code
You can put `inline code`, but you can also put:
```
console.log('Block Code')
```
</markdown-wysiwyg>
````

You can initialize the field by typing (make sure to HTML escape) the markdown code in the tag. You can further modify the code and retrieve the output using the `.value` attribute:

```
console.log(document.querySelector('markdown-wysiwyg').value);// Logs the current markdown value
```

Image upload
============

By default, the user can type the image url when inserting and image. But you can also allow the user to upload an image. For that, you need to add an `onImageUpload` property on the HTML element. It needs to run asynchronously and return the URL when the upload has finished. It can also fail and throw an error:

```
document.querySelector('markdown-wysiwyg').onImageUpload = (file) => {
	return new Promise((resolve, reject) => {
		// Do your upload logic here and call resolve with the image url when the upload finishes
		setTimeout(()=>res(file.name), 2000);
	})
};
```

Customizations
============
You can customize the styling of the wysiwyg editor as follows:
```
markdown-wysiwyg {
	height:500px; /* fixed height */
	--primary-color:#d35400;
	--primary-color-contrast:#FFFFFF;
}
markdown-wysiwyg::part(wrapper) {
	box-shadow:none;
	border:1px solid #d35400;
}
markdown-wysiwyg::part(buttons) {
	background:#d35400;
	--buttons-filter:invert(1);
	--buttons-bg-highlight-color:rgba(255, 255, 255, 0.3);
}

```

Known issues
============

[Turndown](https://github.com/domchristie/turndown) does a great job at converting Markdown to HTML, but there are edge cases where it might fail. This component tries to clean the HTML code beforehand to make it easier for [Turndown](https://github.com/domchristie/turndown). Some known issues:
*   Doing in-word bold/italic/strikethrough formatting sometimes fails
*   Multiple line breaks sometimes get removed
