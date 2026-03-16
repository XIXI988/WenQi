import { Block, BlockType, Page } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const serializePageToMarkdown = (page: Page, allPages: Record<string, Page>): string => {
  let markdown = `# ${page.title}\n\n`;

  page.blocks.forEach((block) => {
    switch (block.type) {
      case 'h1':
        markdown += `# ${block.content}\n`;
        break;
      case 'h2':
        markdown += `## ${block.content}\n`;
        break;
      case 'h3':
        markdown += `### ${block.content}\n`;
        break;
      case 'h4':
        markdown += `#### ${block.content}\n`;
        break;
      case 'h5':
        markdown += `##### ${block.content}\n`;
        break;
      case 'h6':
        markdown += `###### ${block.content}\n`;
        break;
      case 'bulleted_list':
        markdown += `- ${block.content}\n`;
        break;
      case 'numbered_list':
        // We don't track the actual number in the block, so we just use 1.
        // Markdown viewers will handle the numbering.
        markdown += `1. ${block.content}\n`;
        break;
      case 'todo':
        markdown += `- [${block.properties?.checked ? 'x' : ' '}] ${block.content}\n`;
        break;
      case 'quote':
        markdown += `> ${block.content}\n`;
        break;
      case 'code':
        markdown += `\`\`\`\n${block.content}\n\`\`\`\n`;
        break;
      case 'divider':
        markdown += `---\n`;
        break;
      case 'image':
        markdown += `![${block.properties?.caption || ''}](${block.properties?.url || ''})\n`;
        break;
      case 'page':
        const targetPage = block.properties?.targetPageId ? allPages[block.properties.targetPageId] : null;
        if (targetPage) {
          markdown += `[${targetPage.title}](${targetPage.id}.md)\n`;
        }
        break;
      case 'table':
        const rows = block.properties?.rows || [];
        if (rows.length > 0) {
          rows.forEach((row, index) => {
            markdown += `| ${row.join(' | ')} |\n`;
            if (index === 0) {
              markdown += `| ${row.map(() => '---').join(' | ')} |\n`;
            }
          });
        }
        break;
      case 'text':
      default:
        markdown += `${block.content}\n`;
        break;
    }
    markdown += '\n';
  });

  return markdown.trim();
};

export const parseMarkdownToBlocks = (markdown: string): { title: string; blocks: Block[] } => {
  const lines = markdown.split('\n');
  let title = '';
  const blocks: Block[] = [];

  // Check if first line is H1 title
  let startIndex = 0;
  if (lines[0] && lines[0].startsWith('# ')) {
    title = lines[0].substring(2).trim();
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('<!--')) continue;

    // Code block
    if (line.startsWith('```')) {
      let codeContent = '';
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeContent += lines[i] + '\n';
        i++;
      }
      blocks.push(createBlock('code', codeContent.trim()));
      continue;
    }

    // Headers
    if (line.startsWith('###### ')) {
      blocks.push(createBlock('h6', line.substring(7)));
    } else if (line.startsWith('##### ')) {
      blocks.push(createBlock('h5', line.substring(6)));
    } else if (line.startsWith('#### ')) {
      blocks.push(createBlock('h4', line.substring(5)));
    } else if (line.startsWith('### ')) {
      blocks.push(createBlock('h3', line.substring(4)));
    } else if (line.startsWith('## ')) {
      blocks.push(createBlock('h2', line.substring(3)));
    } else if (line.startsWith('# ')) {
      blocks.push(createBlock('h1', line.substring(2)));
    }
    // Todo
    else if (line.startsWith('- [ ] ')) {
      blocks.push(createBlock('todo', line.substring(6), { checked: false }));
    } else if (line.startsWith('- [x] ')) {
      blocks.push(createBlock('todo', line.substring(6), { checked: true }));
    }
    // Lists
    else if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('+ ')) {
      blocks.push(createBlock('bulleted_list', line.substring(2)));
    } else if (/^\d+\.\s/.test(line)) {
      const content = line.replace(/^\d+\.\s/, '');
      blocks.push(createBlock('numbered_list', content));
    }
    // Quote
    else if (line.startsWith('> ')) {
      blocks.push(createBlock('quote', line.substring(2)));
    }
    // Divider
    else if (line === '---' || line === '***' || line === '___') {
      blocks.push(createBlock('divider', ''));
    }
    // Image
    else if (line.startsWith('![') && line.includes('](')) {
      const captionMatch = line.match(/!\[(.*?)\]/);
      const urlMatch = line.match(/\((.*?)\)/);
      blocks.push(createBlock('image', '', { 
        caption: captionMatch ? captionMatch[1] : '',
        url: urlMatch ? urlMatch[1] : ''
      }));
    }
    // Table (very basic parsing)
    else if (line.startsWith('|')) {
      // Skip separator line
      if (line.includes('---')) continue;
      
      const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
      // If previous block was a table, add row to it
      if (blocks.length > 0 && blocks[blocks.length - 1].type === 'table') {
        const tableBlock = blocks[blocks.length - 1];
        if (tableBlock.properties?.rows) {
          tableBlock.properties.rows.push(cells);
        }
      } else {
        blocks.push(createBlock('table', '', { rows: [cells] }));
      }
    }
    // Text
    else {
      blocks.push(createBlock('text', line));
    }
  }

  return { title, blocks };
};

const createBlock = (type: BlockType, content: string, properties?: any): Block => ({
  id: uuidv4(),
  type,
  content,
  properties
});
