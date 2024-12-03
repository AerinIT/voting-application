cmd_Release/pprof.node := ln -f "Release/obj.target/pprof.node" "Release/pprof.node" 2>/dev/null || (rm -rf "Release/pprof.node" && cp -af "Release/obj.target/pprof.node" "Release/pprof.node")
