# Article Write Page - Complete Feature Guide

## Overview
The Article Write Page (`/knowledge-hub/write`) is a fully-featured WYSIWYG (What You See Is What You Get) editor for creating and publishing agricultural knowledge hub articles. All formatting features are fully implemented and working.

---

## 🎨 Text Formatting Features

### Heading Levels
- **H1 (Heading 1)**: Large main headings - Perfect for section titles
- **H2 (Heading 2)**: Secondary headings - Good for subsections
- **H3 (Heading 3)**: Tertiary headings - For sub-subsections

### Text Styles
- **Bold (Ctrl+B)**: Make text stand out with `<strong>` tags
- **Italic (Ctrl+I)**: Emphasize text with `<em>` tags
- **Underline (Ctrl+U)**: Draw attention with underlined text
- **Strikethrough**: Show deprecated or corrected content

---

## 📋 Content Structures

### Lists
- **Bullet List**: Create unordered lists (•)
- **Numbered List**: Create ordered/sequential lists (1, 2, 3...)

### Block Elements
- **Block Quote**: Highlight important quotes or citations
  - Styled with left border and background color
  - Perfect for testimonials or expert quotes
  
- **Code Block**: Insert pre-formatted code snippets
  - Maintains monospace formatting
  - Good for technical instructions
  
- **Horizontal Rule**: Visual separator between sections (---)

---

## 🔗 Advanced Features

### Insert Links
1. Click the "Link" icon (🔗) in the toolbar
2. Enter the URL (e.g., `https://example.com`)
3. Select text and click "Insert Link"
4. Links are styled in blue and clickable

### Insert Images
1. Click the "Image" icon (🖼️) in the toolbar
2. Provide the image URL (e.g., `https://example.com/image.jpg`)
3. (Optional) Add Alt Text for accessibility
4. Click "Insert Image"
5. Images render with rounded corners and borders

---

## ➡️ Text Alignment
- **Align Left**: Standard paragraph alignment
- **Align Center**: Center important text or headings
- **Align Right**: Right-align text when needed

---

## ↩️ Undo/Redo
- **Undo**: Revert the last action (Ctrl+Z equivalent)
- **Redo**: Restore undone actions
- Unlimited undo/redo history

---

## 📜 Styling & Appearance

### Prose Styling
The editor uses Tailwind CSS prose styles for beautiful typography:
- Proper line height and spacing for readability
- Semantic font sizing for hierarchy
- Dark mode support included
- Responsive design for all screen sizes

### Headings Look:
- **H1**: 30px, bold, with bottom border, large margins
- **H2**: 24px, bold, large top/bottom margins
- **H3**: 20px, bold, medium margins
- **H4**: 18px, bold, standard margins

### Paragraphs:
- 12px or 16px font size
- Proper line height (1.5x)
- Comfortable spacing between paragraphs

### Code Styling:
- Inline code: Gray background with rounded corners
- Code blocks: Dark background, scrollable, monospace font

### Lists:
- Bullet lists: Indented with proper bullets
- Numbered lists: Auto-numbered with proper spacing

### Blockquotes:
- Left border accent (green/primary color)
- Light background
- Italic text
- Extra padding for emphasis

---

## 🎯 User Interface Features

### Sticky Toolbar
- Toolbar stays at the top while scrolling
- Always accessible for formatting
- Organized into sections with separators

### Scroll-to-Top Button
- Appears after scrolling down 300px
- Floating button in bottom-right corner
- Click to instantly jump to the top
- Smooth animation on hover

### Editor Area
- Large writing space (500px minimum height)
- Expands automatically with content
- Scrollable with smooth scrolling
- Placeholder text for guidance
- Content persists as you type

---

## 📝 Page Layout

### Left Column (Main Writing Area)
1. **Article Title**: Large text input (3xl bold)
   - Clear placeholder: "Enter an engaging title..."
   - Live focus ring

2. **Article Excerpt**: Multi-line textarea (3 rows)
   - Placeholder: Guides users to write 1-2 sentences
   - Larger text for emphasis

3. **Rich Text Editor**: Full WYSIWYG editor
   - All formatting tools available
   - Live preview of styling
   - Paste support for plain text

### Right Column (Sidebar)
1. **Cover Image**
   - Drag & drop zone
   - Upload preview (160px height)
   - Remove button on preview
   - File size limit: 5MB

2. **Article Settings**
   - **Category**: Dropdown with 10 categories
     - Crop Management, Pest Control, Organic Farming, etc.
   - **Tags**: Multi-tag input (max 5 tags)
   - **Featured Article**: Toggle switch
   - Toggle shows article on homepage

3. **Writing Tips**
   - Helpful guidelines
   - Best practices highlighting
   - Styled with amber background

---

## 🎬 Toolbar Organization

### Section 1: History
- Undo, Redo

### Section 2: Headings
- H1, H2, H3

### Section 3: Text Formatting
- Bold, Italic, Underline, Strikethrough

### Section 4: Lists
- Bullet List, Numbered List

### Section 5: Block Elements
- Quote, Code, Horizontal Rule

### Section 6: Alignment
- Left, Center, Right

### Section 7: Media
- Insert Link (popup with URL input)
- Insert Image (popup with URL + Alt Text)

---

## 📖 Preview Mode

Click **"Preview"** button to see how your article will look:
- Full article view with cover image
- Proper formatting and styling applied
- Dark mode compatible
- Shows title, excerpt, and content together
- Switch back to "Edit" to continue writing

---

## 💾 Save & Publish

### Top-Right Actions Bar (Sticky)
- **Preview** Button: Toggle between edit/preview
- **Save Draft** Button: Save work without publishing
  - Saves article with `status: "draft"`
  - Can be edited later
  
- **Publish** Button: Publish article live
  - Validates required fields:
    - Title
    - Excerpt
    - Content
    - Category
  - Changes status to `published`
  - Redirects to knowledge hub on success

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+B | Bold |
| Ctrl+I | Italic |
| Ctrl+U | Underline |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Enter (in Image/Link popover) | Insert |

---

## ✨ Special Features

### Smart Placeholder
- Disappears when you start typing
- Reappears if content is deleted
- Guides new users without being intrusive

### Dark Mode Support
- All styling includes dark mode variants
- Comfortable reading in low light
- Automatic based on system preferences

### Responsive Design
- Mobile-friendly layout
- Stacks to single column on small screens
- Touch-friendly buttons and inputs

### Validation
- Required fields checked before publishing
- Clear error messages
- Prevents accidental blank posts

---

## 🚀 How to Use

### Step 1: Start Writing
1. Go to `/knowledge-hub/write`
2. Enter article title
3. Write excerpt (summary)

### Step 2: Format Content
1. Click in the rich editor
2. Type or paste your content
3. Use toolbar buttons to format
4. Add headings, lists, quotes as needed
5. Insert images and links

### Step 3: Add Media
1. Upload cover image from sidebar
2. Click image toolbar button to add images in content
3. Click link toolbar button to add URLs

### Step 4: Configure
1. Select category from dropdown
2. Add tags (max 5)
3. (Optional) Mark as featured

### Step 5: Review
1. Click "Preview" to see final result
2. Check formatting and styling
3. Return to "Edit" if changes needed

### Step 6: Publish
1. Click "Publish" button
2. Article goes live immediately
3. Redirects to Knowledge Hub

---

## 🎨 Styling Examples

### Bold Text
```
Select text → Click Bold button → Text becomes **bold**
```

### Heading
```
Type text → Click H2 button → Becomes 24px bold heading
```

### List
```
Click Bullet List → Creates • Points
Click Numbered List → Creates 1. 2. 3. Points
```

### Blockquote
```
Click Quote button → Creates indented, bordered quote
```

### Code Block
```
Click Code button → Creates <pre> code block with monospace font
```

---

## 📊 Features Summary

| Feature | Status | Details |
|---------|--------|---------|
| H1, H2, H3 | ✅ | Full heading support |
| Bold, Italic, Underline | ✅ | Text styling |
| Strikethrough | ✅ | Mark deleted text |
| Bullet Lists | ✅ | Unordered lists |
| Numbered Lists | ✅ | Ordered lists |
| Block Quotes | ✅ | Citation/quote styling |
| Code Blocks | ✅ | Pre-formatted code |
| Horizontal Rule | ✅ | Visual separators |
| Text Alignment | ✅ | Left, Center, Right |
| Links | ✅ | URL insertion with preview |
| Images | ✅ | Image insertion with alt text |
| Undo/Redo | ✅ | Full edit history |
| Scroll Button | ✅ | Quick jump to top |
| Preview Mode | ✅ | WYSIWYG preview |
| Draft Save | ✅ | Save without publishing |
| Publish | ✅ | Go live immediately |
| Dark Mode | ✅ | Full dark mode support |
| Mobile Responsive | ✅ | All devices supported |

---

## 🎯 Use Cases

### Crop Management Article
- H1: Main crop title
- H2: Growing seasons, pest management
- Lists: Step-by-step instructions
- Images: Plant photos, pest identification
- Blockquote: Expert tips

### Organic Farming Guide
- H1: Article title
- H2: Methods, benefits, challenges
- Lists: Organic practices
- Links: Resources and certifications
- Bold: Important guidelines

### Market Insights Report
- H1: Title
- H3: Data points
- Tables (via HTML): Market prices
- Lists: Key findings
- Code blocks: Data tables

---

## 💡 Tips & Best Practices

1. **Use Headings Wisely**: Structure content with H1 → H2 → H3
2. **Bold Keywords**: Make important terms stand out
3. **Add Images Early**: Visual content improves engagement
4. **Use Lists**: Break up long paragraphs
5. **Save Drafts Often**: Don't lose work
6. **Preview Before Publishing**: Check formatting
7. **Link Resources**: Provide references and external links
8. **Write Good Excerpts**: First line matters for engagement
9. **Choose Relevant Category**: Helps discoverability
10. **Add Descriptive Tags**: Improves searchability

---

## 🔧 Technical Details

- **Editor Type**: Contenteditable DIV
- **Content Format**: HTML
- **Framework**: Next.js 13+ (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS + Prose
- **Icons**: Lucide React
- **Storage**: MongoDB (via API)

---

## 🎓 Learning Resources

- Markdown can be used: Most shortcuts work
- Copy-paste from other sources: Plain text preserved
- Keyboard shortcuts: Standard browser shortcuts work
- Browser support: All modern browsers supported

---

## ❓ FAQ

**Q: Can I use HTML directly?**
A: Yes, contentEditable supports HTML. Paste HTML and it will render.

**Q: How do I edit a published article?**
A: Draft functionality coming soon.

**Q: Is there a character limit?**
A: No hard limit, but aim for 1,000-5,000 words for readability.

**Q: Can I schedule publishing?**
A: Currently publishes immediately. Scheduling feature coming soon.

**Q: Are images hosted on your server?**
A: Images must be external URLs. Upload to Cloudinary or similar service first.

**Q: How do I add tables?**
A: Currently not in toolbar. Can paste HTML table code directly.

**Q: Can I have different font colors?**
A: Not in current version. Can be added as feature request.

---

## 📞 Support

For issues or feature requests, please contact the development team.

---

*Last Updated: February 24, 2026*
*Version: 1.0 - Full Feature Release*
