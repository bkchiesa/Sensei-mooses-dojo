#!/usr/bin/env python3
"""Emit a structurally valid native iPhone Xcode project for SenseiMoosesDojo."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROJ = ROOT / "SenseiMoosesDojo.xcodeproj"

SWIFT_FILES = [
    ("AppDelegate.swift", "AppDelegate.swift"),
    ("SceneDelegate.swift", "SceneDelegate.swift"),
    ("GameViewController.swift", "GameViewController.swift"),
    ("Roster.swift", "Game/Roster.swift"),
    ("Stage.swift", "Game/Stage.swift"),
    ("Art.swift", "Game/Art.swift"),
    ("SceneRouter.swift", "Game/SceneRouter.swift"),
    ("FighterActor.swift", "Game/FighterActor.swift"),
    ("VirtualControls.swift", "Game/VirtualControls.swift"),
    ("TitleScene.swift", "Scenes/TitleScene.swift"),
    ("CharacterSelectScene.swift", "Scenes/CharacterSelectScene.swift"),
    ("FightScene.swift", "Scenes/FightScene.swift"),
]


def hid(tag: str) -> str:
    # 24-hex PBX identifiers — stable for a given tag.
    import hashlib

    return hashlib.sha1(tag.encode()).hexdigest()[:24].upper()


def main() -> None:
    ids = {
        "project": hid("project"),
        "target": hid("target"),
        "product": hid("product"),
        "main_group": hid("main_group"),
        "products": hid("products"),
        "src_group": hid("src_group"),
        "game_group": hid("game_group"),
        "scenes_group": hid("scenes_group"),
        "sources": hid("sources"),
        "resources": hid("resources"),
        "frameworks": hid("frameworks"),
        "proj_configs": hid("proj_configs"),
        "target_configs": hid("target_configs"),
        "proj_debug": hid("proj_debug"),
        "proj_release": hid("proj_release"),
        "target_debug": hid("target_debug"),
        "target_release": hid("target_release"),
        "assets_ref": hid("assets_ref"),
        "assets_build": hid("assets_build"),
    }

    file_entries = []
    for name, rel in SWIFT_FILES:
        file_entries.append(
            {
                "name": name,
                "rel": rel,
                "ref": hid(f"ref:{rel}"),
                "build": hid(f"build:{rel}"),
            }
        )

    build_files = []
    file_refs = []
    source_builds = []
    for f in file_entries:
        build_files.append(
            f"\t\t{f['build']} /* {f['name']} in Sources */ = {{isa = PBXBuildFile; fileRef = {f['ref']} /* {f['name']} */; }};"
        )
        file_refs.append(
            f"\t\t{f['ref']} /* {f['name']} */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = {f['name']}; sourceTree = \"<group>\"; }};"
        )
        source_builds.append(f"\t\t\t\t{f['build']} /* {f['name']} in Sources */,")

    build_files.append(
        f"\t\t{ids['assets_build']} /* Assets.xcassets in Resources */ = {{isa = PBXBuildFile; fileRef = {ids['assets_ref']} /* Assets.xcassets */; }};"
    )
    file_refs.append(
        f"\t\t{ids['assets_ref']} /* Assets.xcassets */ = {{isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = Assets.xcassets; sourceTree = \"<group>\"; }};"
    )
    file_refs.append(
        f"\t\t{hid('info-plist')} /* Info.plist */ = {{isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = \"<group>\"; }};"
    )
    file_refs.append(
        f"\t\t{ids['product']} /* SenseiMoosesDojo.app */ = {{isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = SenseiMoosesDojo.app; sourceTree = BUILT_PRODUCTS_DIR; }};"
    )

    root_swift = [f for f in file_entries if "/" not in f["rel"]]
    game_swift = [f for f in file_entries if f["rel"].startswith("Game/")]
    scene_swift = [f for f in file_entries if f["rel"].startswith("Scenes/")]

    def group_children(items):
        return "\n".join(f"\t\t\t\t{i['ref']} /* {i['name']} */," for i in items)

    proj_debug = """				ALWAYS_SEARCH_USER_PATHS = NO;
				CLANG_ANALYZER_NONNULL = YES;
				CLANG_ENABLE_MODULES = YES;
				CLANG_ENABLE_OBJC_ARC = YES;
				COPY_PHASE_STRIP = NO;
				DEBUG_INFORMATION_FORMAT = dwarf;
				ENABLE_STRICT_OBJC_MSGSEND = YES;
				ENABLE_TESTABILITY = YES;
				GCC_C_LANGUAGE_STANDARD = gnu17;
				GCC_DYNAMIC_NO_PIC = NO;
				GCC_OPTIMIZATION_LEVEL = 0;
				GCC_PREPROCESSOR_DEFINITIONS = (
					"DEBUG=1",
					"$(inherited)",
				);
				IPHONEOS_DEPLOYMENT_TARGET = 16.0;
				MTL_ENABLE_DEBUG_INFO = INCLUDE_SOURCE;
				ONLY_ACTIVE_ARCH = YES;
				SDKROOT = iphoneos;
				SWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG;
				SWIFT_OPTIMIZATION_LEVEL = "-Onone";
				SWIFT_VERSION = 5.0;"""

    proj_release = """				ALWAYS_SEARCH_USER_PATHS = NO;
				CLANG_ANALYZER_NONNULL = YES;
				CLANG_ENABLE_MODULES = YES;
				CLANG_ENABLE_OBJC_ARC = YES;
				COPY_PHASE_STRIP = NO;
				DEBUG_INFORMATION_FORMAT = "dwarf-with-dsym";
				ENABLE_NS_ASSERTIONS = NO;
				ENABLE_STRICT_OBJC_MSGSEND = YES;
				GCC_C_LANGUAGE_STANDARD = gnu17;
				IPHONEOS_DEPLOYMENT_TARGET = 16.0;
				MTL_ENABLE_DEBUG_INFO = NO;
				SDKROOT = iphoneos;
				SWIFT_COMPILATION_MODE = wholemodule;
				SWIFT_OPTIMIZATION_LEVEL = "-O";
				SWIFT_VERSION = 5.0;
				VALIDATE_PRODUCT = YES;"""

    target_common = """				ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
				ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				DEVELOPMENT_TEAM = "";
				GENERATE_INFOPLIST_FILE = YES;
				INFOPLIST_FILE = SenseiMoosesDojo/Info.plist;
				INFOPLIST_KEY_CFBundleDisplayName = "Sensei Moose's Dojo";
				INFOPLIST_KEY_LSRequiresIPhoneOS = YES;
				INFOPLIST_KEY_UIApplicationSceneManifest_Generation = YES;
				INFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents = YES;
				INFOPLIST_KEY_UILaunchScreen_Generation = YES;
				INFOPLIST_KEY_UIRequiresFullScreen = YES;
				INFOPLIST_KEY_UIStatusBarHidden = YES;
				INFOPLIST_KEY_UISupportedInterfaceOrientations = "UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/Frameworks",
				);
				MARKETING_VERSION = 0.1.0;
				PRODUCT_BUNDLE_IDENTIFIER = com.bkchiesa.SenseiMoosesDojo;
				PRODUCT_NAME = "$(TARGET_NAME)";
				SUPPORTED_PLATFORMS = "iphoneos iphonesimulator";
				SUPPORTS_MACCATALYST = NO;
				SUPPORTS_MAC_DESIGNED_FOR_IPHONE_IPAD = NO;
				SUPPORTS_XR_DESIGNED_FOR_IPHONE_IPAD = NO;
				SWIFT_EMIT_LOC_STRINGS = YES;
				SWIFT_VERSION = 5.0;
				TARGETED_DEVICE_FAMILY = 1;"""

    pbx = f"""// !$*UTF8*$!
{{
	archiveVersion = 1;
	classes = {{
	}};
	objectVersion = 56;
	objects = {{

/* Begin PBXBuildFile section */
{chr(10).join(build_files)}
/* End PBXBuildFile section */

/* Begin PBXFileReference section */
{chr(10).join(file_refs)}
/* End PBXFileReference section */

/* Begin PBXFrameworksBuildPhase section */
		{ids['frameworks']} /* Frameworks */ = {{
			isa = PBXFrameworksBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			runOnlyForDeploymentPostprocessing = 0;
		}};
/* End PBXFrameworksBuildPhase section */

/* Begin PBXGroup section */
		{ids['main_group']} = {{
			isa = PBXGroup;
			children = (
				{ids['src_group']} /* SenseiMoosesDojo */,
				{ids['products']} /* Products */,
			);
			sourceTree = "<group>";
		}};
		{ids['products']} /* Products */ = {{
			isa = PBXGroup;
			children = (
				{ids['product']} /* SenseiMoosesDojo.app */,
			);
			name = Products;
			sourceTree = "<group>";
		}};
		{ids['src_group']} /* SenseiMoosesDojo */ = {{
			isa = PBXGroup;
			children = (
{group_children(root_swift)}
				{hid('info-plist')} /* Info.plist */,
				{ids['game_group']} /* Game */,
				{ids['scenes_group']} /* Scenes */,
				{ids['assets_ref']} /* Assets.xcassets */,
			);
			path = SenseiMoosesDojo;
			sourceTree = "<group>";
		}};
		{ids['game_group']} /* Game */ = {{
			isa = PBXGroup;
			children = (
{group_children(game_swift)}
			);
			path = Game;
			sourceTree = "<group>";
		}};
		{ids['scenes_group']} /* Scenes */ = {{
			isa = PBXGroup;
			children = (
{group_children(scene_swift)}
			);
			path = Scenes;
			sourceTree = "<group>";
		}};
/* End PBXGroup section */

/* Begin PBXNativeTarget section */
		{ids['target']} /* SenseiMoosesDojo */ = {{
			isa = PBXNativeTarget;
			buildConfigurationList = {ids['target_configs']} /* Build configuration list for PBXNativeTarget "SenseiMoosesDojo" */;
			buildPhases = (
				{ids['sources']} /* Sources */,
				{ids['frameworks']} /* Frameworks */,
				{ids['resources']} /* Resources */,
			);
			buildRules = (
			);
			dependencies = (
			);
			name = SenseiMoosesDojo;
			productName = SenseiMoosesDojo;
			productReference = {ids['product']} /* SenseiMoosesDojo.app */;
			productType = "com.apple.product-type.application";
		}};
/* End PBXNativeTarget section */

/* Begin PBXProject section */
		{ids['project']} /* Project object */ = {{
			isa = PBXProject;
			attributes = {{
				BuildIndependentTargetsInParallel = 1;
				LastSwiftUpdateCheck = 1500;
				LastUpgradeCheck = 1500;
				TargetAttributes = {{
					{ids['target']} = {{
						CreatedOnToolsVersion = 15.0;
					}};
				}};
			}};
			buildConfigurationList = {ids['proj_configs']} /* Build configuration list for PBXProject "SenseiMoosesDojo" */;
			compatibilityVersion = "Xcode 14.0";
			developmentRegion = en;
			hasScannedForEncodings = 0;
			knownRegions = (
				en,
				Base,
			);
			mainGroup = {ids['main_group']};
			productRefGroup = {ids['products']} /* Products */;
			projectDirPath = "";
			projectRoot = "";
			targets = (
				{ids['target']} /* SenseiMoosesDojo */,
			);
		}};
/* End PBXProject section */

/* Begin PBXResourcesBuildPhase section */
		{ids['resources']} /* Resources */ = {{
			isa = PBXResourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
				{ids['assets_build']} /* Assets.xcassets in Resources */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		}};
/* End PBXResourcesBuildPhase section */

/* Begin PBXSourcesBuildPhase section */
		{ids['sources']} /* Sources */ = {{
			isa = PBXSourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
{chr(10).join(source_builds)}
			);
			runOnlyForDeploymentPostprocessing = 0;
		}};
/* End PBXSourcesBuildPhase section */

/* Begin XCBuildConfiguration section */
		{ids['proj_debug']} /* Debug */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
{proj_debug}
			}};
			name = Debug;
		}};
		{ids['proj_release']} /* Release */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
{proj_release}
			}};
			name = Release;
		}};
		{ids['target_debug']} /* Debug */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
{target_common}
			}};
			name = Debug;
		}};
		{ids['target_release']} /* Release */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
{target_common}
			}};
			name = Release;
		}};
/* End XCBuildConfiguration section */

/* Begin XCConfigurationList section */
		{ids['proj_configs']} /* Build configuration list for PBXProject "SenseiMoosesDojo" */ = {{
			isa = XCConfigurationList;
			buildConfigurations = (
				{ids['proj_debug']} /* Debug */,
				{ids['proj_release']} /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		}};
		{ids['target_configs']} /* Build configuration list for PBXNativeTarget "SenseiMoosesDojo" */ = {{
			isa = XCConfigurationList;
			buildConfigurations = (
				{ids['target_debug']} /* Debug */,
				{ids['target_release']} /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		}};
/* End XCConfigurationList section */
	}};
	rootObject = {ids['project']} /* Project object */;
}}
"""

    PROJ.mkdir(parents=True, exist_ok=True)
    (PROJ / "project.pbxproj").write_text(pbx)

    scheme_dir = PROJ / "xcshareddata" / "xcschemes"
    scheme_dir.mkdir(parents=True, exist_ok=True)
    (scheme_dir / "SenseiMoosesDojo.xcscheme").write_text(
        f"""<?xml version="1.0" encoding="UTF-8"?>
<Scheme
   LastUpgradeVersion = "1500"
   version = "1.7">
   <BuildAction
      parallelizeBuildables = "YES"
      buildImplicitDependencies = "YES">
      <BuildActionEntries>
         <BuildActionEntry
            buildForTesting = "YES"
            buildForRunning = "YES"
            buildForProfiling = "YES"
            buildForArchiving = "YES"
            buildForAnalyzing = "YES">
            <BuildableReference
               BuildableIdentifier = "primary"
               BlueprintIdentifier = "{ids['target']}"
               BuildableName = "SenseiMoosesDojo.app"
               BlueprintName = "SenseiMoosesDojo"
               ReferencedContainer = "container:SenseiMoosesDojo.xcodeproj">
            </BuildableReference>
         </BuildActionEntry>
      </BuildActionEntries>
   </BuildAction>
   <TestAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      shouldUseLaunchSchemeArgsEnv = "YES"
      shouldAutocreateTestPlan = "YES">
   </TestAction>
   <LaunchAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      launchStyle = "0"
      useCustomWorkingDirectory = "NO"
      ignoresPersistentStateOnLaunch = "NO"
      debugDocumentVersioning = "YES"
      debugServiceExtension = "internal"
      allowLocationSimulation = "YES">
      <BuildableProductRunnable
         runnableDebuggingMode = "0">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "{ids['target']}"
            BuildableName = "SenseiMoosesDojo.app"
            BlueprintName = "SenseiMoosesDojo"
            ReferencedContainer = "container:SenseiMoosesDojo.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
   </LaunchAction>
   <ProfileAction
      buildConfiguration = "Release"
      shouldUseLaunchSchemeArgsEnv = "YES"
      savedToolIdentifier = ""
      useCustomWorkingDirectory = "NO"
      debugDocumentVersioning = "YES">
      <BuildableProductRunnable
         runnableDebuggingMode = "0">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "{ids['target']}"
            BuildableName = "SenseiMoosesDojo.app"
            BlueprintName = "SenseiMoosesDojo"
            ReferencedContainer = "container:SenseiMoosesDojo.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
   </ProfileAction>
   <AnalyzeAction
      buildConfiguration = "Debug">
   </AnalyzeAction>
   <ArchiveAction
      buildConfiguration = "Release"
      revealArchiveInOrganizer = "YES">
   </ArchiveAction>
</Scheme>
"""
    )
    print(f"Wrote {PROJ}")


if __name__ == "__main__":
    main()
