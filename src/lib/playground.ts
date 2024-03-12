import template from './playground.html?raw';
import * as cheerio from 'cheerio';

const html = template;
const $ = cheerio.load(html, {
    xml: {
        normalizeWhitespace: true,
        xmlMode: true,
    },
});

/* $('*').each((index, element) => {
    console.log('---');
    const attr = Object.keys(element.attribs)[0];
    
    snipe(element.tagName, attr);
}); */

function transform() {}
function snipe(tagName: string, attr: string) {
    //
    /* const tpl = `{#snippet row(${attr ?? ''})} 
    ${tagName ?? ''}  
	{/snippet}`; */

    const tpl = `{@render ${tagName}(${attr ?? ''})}`;
}

function printElementHierarchy(element: cheerio.Element, indent = '') {
    if ($(element).children()) {
        $(element)
            .children()
            .each((index, child) => {
                printElementHierarchy(child, indent + '  ');
            });
    }
}

function buildElementHierarchy(element: cheerio.Element, index: number = 0): any {
    const children: any[] = [];
    $(element)
        .children()
        .each((index, child) => {
            const childHierarchy = buildElementHierarchy($(child), index);
            if (childHierarchy) {
                children.push(childHierarchy);
            }
        });
    if (Object.keys($(element).attr() ?? {})?.[0]) {
        return {
            [`${Object.keys($(element).attr())}_${$(element).prop('tagName').toLowerCase()}`]: children.length > 0 ? children : null,
        };
    }
    return null;
}

const root = $('row')[0];
printElementHierarchy(root);

const hierarchy = buildElementHierarchy(root);

{
    container: {
        Sidebar: {
            chatMenuList: {
                chatMenuListGroup: {
                }
            }
        }
    }
}
