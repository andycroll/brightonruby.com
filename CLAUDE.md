# Brighton Ruby Conference Website

This is the Jekyll-powered website for Brighton Ruby Conference (brightonruby.com), a summer-y, friendly, one day Ruby conference held in Brighton, UK.

## Technology Stack

- **Framework**: Jekyll 4.4.1
- **Ruby Version**: 3.4.4
- **CSS Framework**: Tailwind CSS 4.0.14
- **Hosting**: Netlify
- **Build Tool**: Bundler

## Development Setup

### Prerequisites
- Ruby 3.4.4 (managed via `.ruby-version`)
- Bundler gem

### Installation
```bash
bundle install
```

### Local Development
```bash
bundle exec jekyll serve
```

### Build for Production
```bash
bundle exec jekyll build
```

### Testing
```bash
bundle exec htmlproofer ./_site
```

## Project Structure

- `_archives/` - Archive pages for previous years (2014-2025)
- `_config.yml` - Jekyll configuration
- `_drafts/` - Draft content (MJML email templates)
- `_includes/` - Reusable template partials
- `_layouts/` - Page layout templates
- `_misc/` - Miscellaneous pages (code of conduct, food & drink, etc.)
- `_posts/` - Speaker session posts organized by year
- `assets/css/` - Stylesheets and custom fonts
- `cache/resize/` - Generated image thumbnails (96x96px)
- `files/` - Downloadable PDFs (sponsorship deck, worksheets)
- `fonts/` - MonoLisa variable font files
- `images/` - Conference photos, speaker headshots, sponsor logos organized by year

## Key Features

- **Annual Archives**: Each year has its own archive page with speaker lineup
- **Speaker Sessions**: Individual pages for each talk with speaker bio and abstract  
- **Sponsor Management**: Gold and silver sponsor tiers with logos and links
- **Image Optimization**: Automatic image resizing via jekyll-resize plugin
- **Responsive Design**: Tailwind CSS with typography plugin

## Content Management

### Adding a New Year
1. Create new directory in `_posts/YYYY/`
2. Add archive page in `_archives/YYYY.md`
3. Create speaker session markdown files in `_posts/YYYY/`

### Speaker Session Format
Each session should include:
- Title, speaker name, and bio
- Session abstract/description
- Speaker headshot in `images/YYYY/speakers/`
- YouTube video embed (if available)

### Sponsor Management
Update sponsor lists in `index.html` frontmatter:
- `gold:` array for gold sponsors
- `silver:` array for silver sponsors

## Deployment

- **Platform**: Netlify
- **Node Version**: 17.6 (configured in netlify.toml)
- **Auto-deploy**: Triggered on git push to main branch
- **Custom Headers**: Privacy-focused permissions policy

## File Conventions

- Speaker headshots: `images/YYYY/speakers/firstname_lastname.jpg`
- Sponsor logos: `images/YYYY/sponsors/company_name.svg`
- Session posts: `_posts/YYYY/YYYY-MM-DD-session-title-speaker-name.md`
- Archive pages: `_archives/YYYY.md`

## Custom Plugins

- `jekyll-redirect-from`: Handle URL redirects
- `jekyll-resize`: Automatic image resizing for thumbnails
- `jekyll-tailwindcss`: Tailwind CSS integration

## Development Notes

- Conference typically runs in late June/early July
- Site includes both current year content and historical archives
- Images are automatically resized to 96x96px thumbnails
- Uses custom MonoLisa font for typography
- Includes email template drafts in MJML format for use in mailcoach mailing software