const H = require('upperh');
const MarkdownIt = require('markdown-it');
//const TurndownService = require('turndown');
import TurndownService from 'turndown'
var turndownPluginGfm = require('turndown-plugin-gfm'); // gives support to tables, strikethrough
var turndownService = new TurndownService({
	emDelimiter		: '*',
	codeBlockStyle	: 'fenced',
});
turndownService.addRule('strikethrough', {
	filter: ['del', 's', 'strike'],
	replacement: content => '~~' + content + '~~',
});
turndownService.use([turndownPluginGfm.tables, turndownPluginGfm.taskListItems]);


const style = require('./style.scss').toString();
class MarkdownWysiwyg extends HTMLElement {
	constructor() {
		super();
		let shadowRoot = this.attachShadow({mode: 'closed'});
		let tmpl = document.createElement('template');
		tmpl.innerHTML = `
		<style>${style}</style>
		<div id="wrapper">
			<div id="dialog">
				<form id="link-editor" action="" method="POST">
					<strong>Link Editor</strong>
					<div class="link-text">
						<label>Text</label>
						<input type="text" name="text" />
					</div>
					<div>
						<label>Url</label>
						<input type="text" name="url" placeholder="https://" required pattern="^([hH][tT][tT][pP][sS]?://.+|[fF][tT][pP][sS]?://.+|/.+|#.*|\\?.+|[a-zA-Z0-9_-]+(\\/.*|$))" />
					</div>
					<div>
						<input type="button" value="Remove Link" class="critical" />
						<input type="reset" value="Cancel" />
						<input type="submit" value="Set Link" />
					</div>
				</form>
				<form id="image-editor" action="" method="POST">
					<strong>Insert Image</strong>
					<div class="error-msg"></div>
					<div>
						<label>Image Url</label>
						<input type="text" name="url" placeholder="https://" required pattern="^([hH][tT][tT][pP][sS]?://.+|[fF][tT][pP][sS]?://.+|/.+|#.*|\\?.+|[a-zA-Z0-9_-]+(\\/.*|$))" />
						<div class="upload"><span class="button">Upload</span><input type="file" value="Upload" /></div>
					</div>
					<div>
						<label>Alt. Text</label>
						<input type="text" name="text" />
					</div>
					<div>
						<input type="reset" value="Cancel" />
						<input type="submit" value="Ok" />
					</div>
				</form>
			</div>
			<div id="buttons">
				<div class="heading">
					<strong></strong>
					<div>
						<span data-action="h1">Heading 1</span>
						<span data-action="h2">Heading 2</span>
						<span data-action="h3">Heading 3</span>
						<span data-action="h4">Heading 4</span>
						<span data-action="h5">Heading 5</span>
						<span data-action="h6">Heading 6</span>
					</div>
				</div>
				<span title="Bold" data-action="bold"></span>
				<span title="Italic" data-action="italic"></span>
				<span title="Strike through" data-action="strikeThrough"></span>
				<span title="Link" data-action="link"></span>
				<span title="Image" data-action="image"></span>
				<span title="Blockquote" data-action="blockquote"></span>
				<span title="Bullet List" data-action="ul"></span>
				<span title="Numbered List" data-action="ol"></span>
				<span title="Horizontal Separator" data-action="hr"></span>
				<span title="Code (inline)" data-action="code-inline"></span>
				<span title="Code (block)" data-action="code-block"></span>
				<span title="Clean Formatting" data-action="clean"></span>
				<div class="table">
					<strong></strong>
					<div data-rows="0" data-cols="0">${
						(new Array(10)).fill(0).map((a,j)=>{
							return (new Array(10)).fill(0).map((b,i)=>{
								return '<span data-cols="'+(i+1)+'" data-rows="'+(j+1)+'" data-action="table"></span>';
							}).join('');
						}).join('')
					}</div>
				</div>
				<span title="MarkDown Mode" data-action="md"></span>
			</div>
			<div id="content" contenteditable="true"></div>
			<textarea id="code"></textarea>
		</div>`;
		shadowRoot.appendChild(tmpl.content.cloneNode(true));

		this.$ = H(shadowRoot);
		var ele = this;

		this.$.find('#content').on('paste', function(e) {
			setTimeout(ele.cleanCode.bind(ele), 0);
		});
		document.execCommand('insertBrOnReturn', false, true);
		var lastSelection;
		var lastRange;
		var imageEdit;
		this.$.find('#buttons span[data-action]').on('mousedown', function() {
			var cmd = this.attr('data-action');
			if(!ele.$.find('#content').is(':focus-within'))
				ele.$.find('#content')[0].focus();
			switch(cmd) {
				case 'bold':
				case 'italic':
				case 'strikeThrough':
					document.execCommand(cmd, false, null);
				break;
				case 'blockquote':
				case 'h1':
				case 'h2':
				case 'h3':
				case 'h4':
				case 'h5':
				case 'h6':
					document.execCommand('formatBlock', false, '<'+cmd+'>');
				break;
				case 'hr':
					document.execCommand('insertHorizontalRule', false, null);
				break;
				case 'ol':
					document.execCommand('insertOrderedList', false, null);
				break;
				case 'ul':
					document.execCommand('insertUnorderedList', false, null);
				break;
				case 'code-inline':
				var sel = ele.$[0].getSelection();
					document.execCommand('insertHTML', false, '<code>'+sel+'</code>');
				break;
				case 'code-block':
					var sel = document.getSelection();
					document.execCommand('insertHTML', false, '<pre><code>'+sel+'</code></pre>');
				break;
				case 'table':
					var sel = ele.$[0].getSelection();
					sel.collapse(sel.anchorNode, sel.anchorOffset);
					var nRows = this.attr('data-rows');
					var nCols = this.attr('data-cols');
					document.execCommand('insertHTML', false, `<table>
						<thead>
							<tr>${'<th></th>'.repeat(nCols)}</tr>
						</thead>
						<tbody>
							${('<tr>'+('<td></td>'.repeat(nCols))+'</tr>').repeat(nRows-1)}
						</tbody>
					</table>`);
				break;
				case 'link':
					sel = ele.$[0].getSelection();
					lastSelection = {
						anchorNode		: sel.anchorNode,
						anchorOffset	: sel.anchorOffset,
						text			: sel.toString(),
					};
					var a = H(sel.baseNode).closest('a');
					if(sel.type=='Caret' && a.length==0) {
						ele.$.find('#dialog .link-text').show();
						ele.$.find('#dialog #link-editor [name="text"]').val('');
						lastRange = undefined;
					} else {
						ele.$.find('#dialog .link-text').hide();
						lastRange = sel.getRangeAt(0).cloneRange();
					}
					if(a.length==1)
						ele.$.find('#dialog #link-editor .critical').show();
					else
						ele.$.find('#dialog #link-editor .critical').hide();
					ele.$.find('#dialog #link-editor [name="url"]').val(a.length==1?a.attr('href'):'');
					ele.$.find('#dialog').attr('data-dialog', 'link-editor');
				break;
				case 'image':
					sel = ele.$[0].getSelection();
					lastSelection = {
						anchorNode		: sel.anchorNode,
						anchorOffset	: sel.anchorOffset,
						text			: sel.toString(),
					};
					if(sel.type=='Caret') {
						lastRange = undefined;
					} else {
						lastRange = sel.getRangeAt(0).cloneRange();
					}
					imageEdit = false;
					ele.$.find('#dialog').attr('data-dialog', 'image-editor');
					ele.$.find('#dialog #image-editor .error-msg').empty();
					if(ele.onImageUpload)
						ele.$.find('#dialog #image-editor .upload').show();
					else
						ele.$.find('#dialog #image-editor .upload').hide();

				break;
				case 'clean':
					const selection = ele.$[0].getSelection();
					var node = selection.type=='Range'?selection.getRangeAt(0).commonAncestorContainer:selection.baseNode;
					if(node.nodeType!=1)
						node = node.parentElement;
					if(node.nodeName=='CODE' && node.parentElement.nodeName=='PRE')
						node = node.parentElement;
					if(node.getAttribute('id')=='content') {
						document.execCommand('removeFormat', false, null);
					} else {
						var sel = ele.$[0].getSelection();
						var range = sel.getRangeAt(0);
						var save = {
							startOffset	: range.startOffset,
							endOffset	: range.endOffset,
						};
						var par = node.parentElement;
						var index = Array.from(par.childNodes).indexOf(node);
						if(node.previousSibling && node.previousSibling.nodeType==3) {
							index--;
							save.startOffset += node.previousSibling.length;
						}
						node.outerHTML = H.escape((H(node).css('display')=='block'?"\n":'')+node.innerText+(H(node).css('display')=='block'?"\n":'')).replace(/(\r?\n)+/g, '<br />'+"\n");
						try {
							range.setStart(par.childNodes[index], save.startOffset);
							range.setEnd(par.childNodes[index], save.endOffset);
							setTimeout(()=>{
								sel.removeAllRanges();
								sel.addRange(range);
							}, 0);
						} catch(e) {}
					}
				break;
				case 'md':
					if(ele.$.find('#wrapper').is('[data-code-mode]')) {
						ele.$.find('#wrapper').removeAttr('data-code-mode');
						ele.$.find('#content').html((new MarkdownIt()).render(ele.$.find('#code').prop('value')).replace(/>(\r?\n)+</g, '><'));
					} else {
						ele.$.find('#wrapper').attr('data-code-mode', '');
						ele.$.find('#code').prop('value', ele.value);
					}
				break;
			}
			ele.cleanCode();
		});

		this.$.find('#buttons .table>div>span').on('mouseenter', function(e) {
			this.closest('div').attr('data-rows', this.attr('data-rows'));
			this.closest('div').attr('data-cols', this.attr('data-cols'));
		});
		this.$.find('#buttons .table>div').on('mouseleave', function(e) {
			this.attr('data-rows', '0');
			this.attr('data-cols', '0');
		});
		this.$.find('#dialog form').on('reset', function(e) {
			ele.$.find('#dialog').removeAttr('data-dialog');
		});
		this.$.find('#dialog #link-editor').on('click', '.critical', function(e) {
			var a = lastRange && H(lastRange.startContainer).closest('a');
			if(a)
				a[0].outerHTML = a[0].innerHTML;
			ele.$.find('#dialog').removeAttr('data-dialog');
		});
		this.$.find('#dialog #link-editor').on('submit', function(e) {
			e.preventDefault();
			e.stopPropagation();

			var url = ele.$.find('#dialog #link-editor [name="url"]')[0].checkValidity() && ele.$.find('#dialog #link-editor [name="url"]').val();
			var text = ele.$.find('#dialog #link-editor [name="text"]').val();
			if(url) {
				var a = lastRange && H(lastRange.startContainer).closest('a');
				var sel = ele.$[0].getSelection();
				sel.removeAllRanges();
				if(lastRange)
					sel.addRange(lastRange);
				else
					sel.collapse(lastSelection.anchorNode, lastSelection.anchorOffset);
				if(!lastRange) {
					document.execCommand('insertHTML', false, '<a href="'+encodeURI(url)+'">'+H.escape(text || 'link')+'</a>');
				} else if(a && a.length===1) {
					a.attr('href', url);
				} else
					document.execCommand('createLink', false, url);
				ele.$.find('#dialog form').trigger('reset');
				ele.cleanCode.call(ele);
			} else {
				ele.$.find('#dialog #link-editor [name="url"]')[0].reportValidity();
			}
		});
		this.$.find('#content').on('click', 'img', function(e) {
			imageEdit = this;
			ele.$.find('#dialog #image-editor [name="url"]').val(this.attr('src'));
			ele.$.find('#dialog #image-editor [name="text"]').val(this.attr('alt') || '');
			ele.$.find('#dialog').attr('data-dialog', 'image-editor');
		});
		this.$.find('#dialog #image-editor').on('submit', function(e) {
			e.preventDefault();
			e.stopPropagation();
			var url = ele.$.find('#dialog #image-editor [name="url"]')[0].checkValidity() && ele.$.find('#dialog #image-editor [name="url"]').val();
			var text = ele.$.find('#dialog #image-editor [name="text"]').val();
			if(url) {
				if(imageEdit) {
					imageEdit.attr('src', url).attr('alt', text);
				} else {
					var a = lastRange && H(lastRange.startContainer).closest('a');
					var sel = ele.$[0].getSelection();
					sel.removeAllRanges();
					sel.collapse(lastSelection.anchorNode, lastSelection.anchorOffset);
					document.execCommand('insertHTML', false, '<img src="'+encodeURI(url)+'" alt="'+H.escape(text || 'Image')+'" />');
				}
				ele.$.find('#dialog form').trigger('reset');
				ele.cleanCode.call(ele);
			} else {
				ele.$.find('#dialog #link-editor [name="url"]')[0].reportValidity();
			}
		});
		this.$.find('#content').on('input keyup', function(e) {
			if(['Enter', 'Delete', 'Backspace'].includes(e.key))
				ele.cleanCode.call(ele);
		});
		this.$.find('#dialog #image-editor .upload input').on('change', async function(e) {
			var file = this[0].files[0];
			this.trigger('reset');
			if(file) {
				this.closest('.upload').attr('data-loading', '');
				ele.$.find('#dialog #image-editor .error-msg').empty();
				if(file) {
					try {
						var url = await ele.onImageUpload.call(ele, file);
						if(typeof url=='string')
							ele.$.find('#dialog #image-editor [name="url"]').val(url);
					} catch(e) {
						ele.$.find('#dialog #image-editor .error-msg').text(e.toString());
					}
					this.closest('.upload').removeAttr('data-loading');
				}
			} else
				this.closest('.upload').removeAttr('data-loading');
		});
		H(() => {
			this.value = H(this).text();
			H(this).text('');
		});
	}
	get value() {
		this.cleanCode();
		var code = this.$.find('#content').html();
		var markdown = turndownService.turndown(code);

		// A Few corrections (solves some bugs)
		markdown = markdown.replace(/\*{6}|\*{4}/g, '');//.replace(/\n(  )?\r?\n/g, "\n\\\n").replace(/\n(  )?\r?\n\r?\n/g, "\n\\\n");

		this.$.find('#content').html(code);
		return markdown;
	}
	set value(newV) {
		this.$.find('#code').prop('value', newV);
		this.$.find('#content').html((new MarkdownIt()).render(newV).replace(/>(\r?\n)+</g, '><'));
	}
	cleanCode() {
		this.$.find('#content *').forEach(e=>{
			var attrs = Array.from(e.attributes);
			for(let a of attrs) {
				if(
					(e.nodeName=='A' && a.name=='href') ||
					(e.nodeName=='TD' && a.name=='align') ||
					(e.nodeName=='TH' && a.name=='align') ||
					(e.nodeName=='IMG' && ['src', 'alt'].includes(a.name))
				) {

				} else if ((e.nodeName=='TD' || e.nodeName=='TH') && a.name=='style') {
					if(a.value.match(/text-align\:\s*center/i))
					e.setAttribute('align', 'center');
					else if(a.value.match(/text-align\:\s*left/i))
					e.setAttribute('align', 'left');
					else if(a.value.match(/text-align\:\s*right/i))
					e.setAttribute('align', 'right');
					e.removeAttribute(a.name);
				} else
				e.removeAttribute(a.name);
			}
		});

		var forbidenTagSelector = '*'+('div,a,b,i,em,s,del,strike,ul,ol,li,strong,hr,br,p,h1,h2,h3,h4,h5,h6,img,table,tr,th,td,tbody,thead,blockquote,code,pre'.split(',').map(a=>':not('+a+')').join(''));
		var tag = this.$[0].querySelector('#content '+forbidenTagSelector);
		while(tag) {
			tag.outerHTML = tag.innerHTML;
			tag = this.$[0].querySelector('#content '+forbidenTagSelector);
		}
		var forbidenNestedTagSelector = 'table br, table div, table p, table h1, table h2, table h3, table h4, table h5, table h6, table ul, table ol, table li, table blockquote, table pre, table hr, table table'.split(',').map(a=>'#content '+a).join(',');
		tag = this.$[0].querySelector(forbidenNestedTagSelector);
		while(tag) {
			console.log(tag.outerHTML);
			if('br,hr'.split(',').includes(tag.nodeName.toLowerCase()))
				tag.parentElement.removeChild(tag);
			else if('table'.split(',').includes(tag.nodeName.toLowerCase()))
				tag.outerHTML = tag.innerText;
			else
				tag.outerHTML = tag.innerHTML;
			tag = this.$[0].querySelector(forbidenNestedTagSelector);
		}
		var tags = this.$[0].querySelectorAll('#content pre, #content code');
		for(let tag of tags) {
			if(tag) {
				if(tag.nodeName=='PRE') {
					var codes = tag.querySelector('code');
					while(codes) {
						codes.outerHTML = codes.innerHTML+"\n";
						codes = tag.querySelector('code');
					}
					tag.innerHTML = '<code>'+H.escape(tag.innerText.replace(/(\r?\n)+$/, ''))+'</code>';
				} else
				tag.innerHTML = tag.innerText;
			}
		}

	}
}
window.customElements.define('markdown-wysiwyg', MarkdownWysiwyg);
