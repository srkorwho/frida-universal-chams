function setupShaderHook() {
    try {
        var MTLDevice = ObjC.classes._MTLDevice;
        
        if (!MTLDevice) {
            setTimeout(setupShaderHook, 1000);
            return;
        }
        
        var newLibraryWithSource = MTLDevice['- newLibraryWithSource:options:error:'];
        
        if (!newLibraryWithSource) {
            return;
        }
        
        Interceptor.attach(newLibraryWithSource.implementation, {
            onEnter: function(args) {
                try {
                    var source = new ObjC.Object(args[2]);
                    var shaderCode = source.toString();
                    
                    if (shaderCode.includes("_Color6")) {
                        var insertPos = shaderCode.indexOf("return");
                        if (insertPos !== -1) {
                            var modifiedCode = 
                                shaderCode.slice(0, insertPos) +
                                "output.SV_Target0.xyzw = half4(0.0/255.0,255.0/255.0,0.0/255.0, 1.0/255.0);" +
                                shaderCode.slice(insertPos);
                            
                            var modifiedSource = ObjC.classes.NSString.stringWithUTF8String_(
                                Memory.allocUtf8String(modifiedCode)
                            );
                            args[2] = modifiedSource.handle;
                        }
                    }
                    
                    if (shaderCode.includes("float3 _WorldSpaceCameraPos") &&
                        shaderCode.includes("float4 hlslcc_mtx4x4unity_ObjectToWorld[4]") &&
                        shaderCode.includes("float4 hlslcc_mtx4x4unity_WorldToObject[4]") &&
                        shaderCode.includes("float4 hlslcc_mtx4x4unity_MatrixVP[4]")) {
                        
                        var insertPos = shaderCode.indexOf("return");
                        if (insertPos !== -1) {
                            var modifiedCode = 
                                shaderCode.slice(0, insertPos) +
                                "output.mtl_Position.z = 1.0;" +
                                shaderCode.slice(insertPos);
                            
                            var modifiedSource = ObjC.classes.NSString.stringWithUTF8String_(
                                Memory.allocUtf8String(modifiedCode)
                            );
                            args[2] = modifiedSource.handle;
                        }
                    }
                    
                } catch (e) {}
            }
        });
        
    } catch (e) {
        setTimeout(setupShaderHook, 1000);
    }
}

function main() {
    if (ObjC.available) {
        setupShaderHook();
    }
}

setTimeout(main, 2000);
