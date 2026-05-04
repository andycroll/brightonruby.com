module Jekyll
  class InlineSvgTag < Liquid::Tag
    ATTR_PATTERN = /(?<key>[\w-]+)="(?<value>[^"]*)"/.freeze

    def initialize(tag_name, markup, tokens)
      super
      @markup = markup.strip
    end

    def render(context)
      rendered = Liquid::Template.parse(@markup).render(context).strip
      path, attrs = parse_markup(rendered)

      site_source = context.registers[:site].source
      full_path = File.join(site_source, path.sub(%r{\A/}, ""))

      raise ArgumentError, "inline_svg: file not found: #{path}" unless File.exist?(full_path)

      svg = File.read(full_path)
      svg = svg.sub(/\A\s*<\?xml.*?\?>\s*/m, "")
      svg = svg.sub(/\A\s*<!DOCTYPE.*?>\s*/m, "")
      svg = svg.strip

      inject_attrs(svg, attrs)
    end

    private

    def parse_markup(rendered)
      path, rest = rendered.split(/\s+/, 2)
      attrs = rest ? rest.scan(ATTR_PATTERN).to_h : {}
      [path, attrs]
    end

    def inject_attrs(svg, attrs)
      return svg if attrs.empty?

      svg.sub(/<svg\b([^>]*)>/) do
        existing = Regexp.last_match(1).to_s
        merged = attrs.reduce(existing) do |acc, (key, value)|
          if acc =~ /\b#{Regexp.escape(key)}="([^"]*)"/
            acc.sub(/\b#{Regexp.escape(key)}="([^"]*)"/) do
              prev = Regexp.last_match(1)
              combined = key == "class" ? "#{prev} #{value}".strip : value
              %Q(#{key}="#{combined}")
            end
          else
            "#{acc} #{key}=\"#{value}\""
          end
        end
        "<svg#{merged}>"
      end
    end
  end
end

Liquid::Template.register_tag("inline_svg", Jekyll::InlineSvgTag)
