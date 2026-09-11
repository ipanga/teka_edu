import PDFKit
import AppKit
// Prints one line per text line: page, x, y (from top), bold flag, font size, text
let doc = PDFDocument(url: URL(fileURLWithPath: CommandLine.arguments[1]))!
for p in 0..<doc.pageCount {
  let page = doc.page(at: p)!
  let box = page.bounds(for: .mediaBox)
  guard let all = page.selection(for: box) else { continue }
  for line in all.selectionsByLine() {
    let b = line.bounds(for: page)
    let text = (line.string ?? "").replacingOccurrences(of: "\n", with: " ")
    if text.trimmingCharacters(in: .whitespaces).isEmpty { continue }
    var bold = false; var size: CGFloat = 0
    if let attr = line.attributedString, attr.length > 0 {
      if let f = attr.attribute(.font, at: 0, effectiveRange: nil) as? NSFont {
        size = f.pointSize
        bold = f.fontName.lowercased().contains("bold") || f.fontDescriptor.symbolicTraits.contains(.bold)
      }
    }
    print(String(format: "%d\t%.0f\t%.0f\t%@\t%.1f\t%@", p+1, b.minX, box.height - b.maxY, bold ? "B" : "-", size, text))
  }
}
