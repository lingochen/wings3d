#!/usr/bin/env tclsh

proc appendVertical {dir aux fileNames} {
  regsub -all {\S+} $fileNames "\"$dir/&\"" fileNames
  exec convert -append {*}$fileNames "$aux$dir.png"
}

if { $argc != 1} {
  puts "$argv0: Usage: $argv0 <directory>"
  exit 1
}

set dir [lindex $argv 0]

appendVertical $dir "" "sidebar.png open.png save.png undo.png redo.png vertex.png edge.png face.png body.png multi.png pref.png smooth.png perspective.png groundplane.png axes.png"

appendVertical $dir "small_" "small_whole.png small_show.png small_unlock.png small_wire.png small_image.png small_pref.png"
