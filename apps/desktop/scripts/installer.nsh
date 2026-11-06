!include "LogicLib.nsh"
!include "FileFunc.nsh"
!define INSTALLER_SOURCE_DIR "${__FILEDIR__}\..\installer"
!define /ifndef INSTALLER_BUILD_DIR "${__FILEDIR__}\..\.desktop-build\targets\win-x64\installer-ui"

ManifestDPIAware true
!ifndef BUILD_UNINSTALLER
  !define MUI_CUSTOMFUNCTION_GUIINIT InstallerGuiInit
  ; Localized strings painted after the welcome page need runtime vars: $(...)
  ; lookups freeze on the language table once .onInit ends. InstallerAssignLocale
  ; (pages.nsh) reloads them from the generated per-locale aliases, so the welcome
  ; language selector can repaint every later label in the chosen language.
  Var InstallerTextBrowse
  Var InstallerTextChoosePath
  Var InstallerTextDirectoryFailed
  Var InstallerTextDirectoryHint
  Var InstallerTextDirectoryRestoreHint
  Var InstallerTextDiskSpace
  Var InstallerTextExtractCollapse
  Var InstallerTextExtractCopied
  Var InstallerTextExtractCopy
  Var InstallerTextExtractExpand
  Var InstallerTextExtractFailed
  Var InstallerTextExtractHint
  Var InstallerTextExtractSaved
  Var InstallerTextExtractUnsaved
  Var InstallerTextFailed
  Var InstallerTextFinish
  Var InstallerTextInstall
  Var InstallerTextLaunch
  Var InstallerTextLaunchFailed
  Var InstallerTextNativeProgress
  Var InstallerTextPathInvalid
  Var InstallerTextPathOwnership
  Var InstallerTextPathWritable
  Var InstallerTextProgressClean
  Var InstallerTextProgressCopy
  Var InstallerTextProgressExtract
  Var InstallerTextProgressRegister
  Var InstallerTextRunning
  Var InstallerTextUiError
!endif

!macro customHeader
  !define /ifndef INSTALLER_STRINGS_FILE "${INSTALLER_BUILD_DIR}\strings.nsh"
  !include "${INSTALLER_STRINGS_FILE}"
  !ifdef BUILD_UNINSTALLER
    BrandingText " "
    SetFont "Segoe UI" 9
    !ifdef LANG_SIMPCHINESE
      SetFont /LANG=${LANG_SIMPCHINESE} "Microsoft YaHei UI" 9
    !endif
    !include "${INSTALLER_SOURCE_DIR}\uninstall.nsh"
  !endif
  !ifndef BUILD_UNINSTALLER
    !include "${INSTALLER_SOURCE_DIR}\theme.nsh"
    !include "${INSTALLER_SOURCE_DIR}\pages.nsh"
    !include "${INSTALLER_SOURCE_DIR}\lifecycle.nsh"
    Function InstallerCheckAppRunning
      !insertmacro customCheckAppRunning
    FunctionEnd
  !endif
!macroend

!macro customInit
  ${If} ${isForAllUsers}
    MessageBox MB_OK|MB_ICONEXCLAMATION "$(INSTALLER_PER_USER)" /SD IDOK
    SetErrorLevel 2
    Quit
  ${EndIf}
  ReadRegStr $0 HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation
  ${If} $0 != ""
    MessageBox MB_OK|MB_ICONEXCLAMATION "$(INSTALLER_PER_USER)" /SD IDOK
    SetErrorLevel 2
    Quit
  ${EndIf}
  !insertmacro setInstallModePerUser
  StrCpy $hasPerMachineInstallation 0
  StrCpy $hasPerUserInstallation 1
  StrCpy $InstallerPath $INSTDIR
  StrCpy $InstallerTheme "auto"
  ${GetParameters} $0
  ${GetOptions} $0 "/THEME=" $1
  ${IfNot} ${Errors}
    ${If} $1 == "light"
    ${OrIf} $1 == "dark"
    ${OrIf} $1 == "auto"
      StrCpy $InstallerTheme $1
    ${Else}
      MessageBox MB_OK|MB_ICONEXCLAMATION "$(INSTALLER_THEME_ERROR)" /SD IDOK
      SetErrorLevel 2
      Quit
    ${EndIf}
  ${EndIf}
  ; The welcome selector starts from the OS UI language when it is compiled in.
  !ifdef LANG_RUSSIAN
    System::Call 'kernel32::GetUserDefaultUILanguage() i .r1'
    IntOp $1 $1 & 0x3FF
    ${If} $1 == 0x19
      StrCpy $LANGUAGE ${LANG_RUSSIAN}
    ${EndIf}
  !endif
  ClearErrors
  ${GetOptions} $0 "/LANG=" $1
  ${IfNot} ${Errors}
    ${If} $1 == "en_US"
      !ifdef LANG_ENGLISH
        StrCpy $LANGUAGE ${LANG_ENGLISH}
      !else
        MessageBox MB_OK|MB_ICONEXCLAMATION "$(INSTALLER_LANGUAGE_ERROR)" /SD IDOK
        SetErrorLevel 2
        Quit
      !endif
    ${ElseIf} $1 == "ru_RU"
      !ifdef LANG_RUSSIAN
        StrCpy $LANGUAGE ${LANG_RUSSIAN}
      !else
        MessageBox MB_OK|MB_ICONEXCLAMATION "$(INSTALLER_LANGUAGE_ERROR)" /SD IDOK
        SetErrorLevel 2
        Quit
      !endif
    ${Else}
      MessageBox MB_OK|MB_ICONEXCLAMATION "$(INSTALLER_LANGUAGE_ERROR)" /SD IDOK
      SetErrorLevel 2
      Quit
    ${EndIf}
  ${EndIf}
  ; Preload runtime locale vars so silent installs and .onInit checks can
  ; report path/running errors in the resolved language.
  !ifndef BUILD_UNINSTALLER
    !insertmacro InstallerAssignLocaleCurrent
  !endif
  Call InstallerResolveTheme
  InitPluginsDir
  File "/oname=$PLUGINSDIR\brand.bmp" "${INSTALLER_BUILD_DIR}\brand.bmp"
  File "/oname=$PLUGINSDIR\brand-2x.bmp" "${INSTALLER_BUILD_DIR}\brand-2x.bmp"
  File "/oname=$PLUGINSDIR\brand-dark.bmp" "${INSTALLER_BUILD_DIR}\brand-dark.bmp"
  File "/oname=$PLUGINSDIR\brand-dark-2x.bmp" "${INSTALLER_BUILD_DIR}\brand-dark-2x.bmp"
  File "/oname=$PLUGINSDIR\window-frame.dll" "${INSTALLER_BUILD_DIR}\window-frame.dll"
  Call InstallerCheckAppRunning
  ${If} ${Silent}
    Call InstallerPreflight
    ${If} $InstallerError != ""
      SetErrorLevel 2
      Quit
    ${EndIf}
  ${EndIf}
!macroend

!macro customInstallMode
  ; Preserve the directory selected on the custom welcome page.
  StrCpy $installMode CurrentUser
  SetShellVarContext current
  Abort
!macroend

!macro customWelcomePage
  Page custom InstallerWelcome InstallerWelcomeLeave
!macroend

!macro customUnInstall
  Call un.CleanData
!macroend

!macro customPageAfterChangeDir
  !define MUI_PAGE_CUSTOMFUNCTION_PRE InstallerBeforeInstall
  !define MUI_PAGE_CUSTOMFUNCTION_SHOW InstallerProgressShow
!macroend

!macro customFinishPage
  Page custom InstallerFinish InstallerFinishLeave
!macroend

; Installation work publishes stage changes without disturbing the NSIS caller.
!macro InstallerPublishStage Stage
  ; Extraction owns the stack and error flag across these callbacks.
  Push $0
  StrCpy $0 0
  ${If} ${Errors}
    StrCpy $0 1
  ${EndIf}
  System::Store /NOUNLOAD "S"
  System::Call /NOUNLOAD 'user32::SetPropW(p $HWNDPARENT, w "HarnessInstaller.Stage", p ${Stage})'
  System::Store "L"
  ${If} $0 == 1
    SetErrors
  ${Else}
    ClearErrors
  ${EndIf}
  Pop $0
!macroend

!macro customInstallerExtract Archive
  !insertmacro InstallerPublishStage 1
  System::Store /NOUNLOAD "S"
  System::Call /NOUNLOAD '$PLUGINSDIR\window-frame.dll::InstallerExtract(p $HWNDPARENT, w "$PLUGINSDIR\dsh-7za.exe", w "${Archive}", w "$INSTDIR", w "$PLUGINSDIR\extract.log") i.s ?c'
  System::Store "L"
  Pop $R0
  ; The failure report owns 7-Zip's UTF-8 output; the details view only needs the result code.
  StrCpy $R1 "$R0"
!macroend

; The report outlives $PLUGINSDIR so a user can send it; silent installs keep only the file. The updater cache
; directory is never an installation target and leaves with the application on uninstall.
; The directory smoke fixture predefines DSH_INSTALLER_LOG_DIR to keep reports inside its scratch tree.
!ifndef DSH_INSTALLER_LOG_DIR
  !define DSH_INSTALLER_LOG_DIR "$LOCALAPPDATA\${DSH_UPDATER_CACHE_NAME}\installer-logs"
!endif

!macro customInstallerExtractFailed Archive
  Push $0
  Push $1
  Push $2
  Push $3
  Push $4
  Push $5
  Push $6
  ; GetTime yields zero-padded day, month, year, weekday, hour, minute, second.
  ${GetTime} "" "L" $0 $1 $2 $3 $4 $5 $6
  StrCpy $0 "${DSH_INSTALLER_LOG_DIR}\extract-failure-$2$1$0-$4$5$6.log"
  StrCpy $1 1
  ${If} ${Silent}
    StrCpy $1 0
  ${EndIf}
  System::Call '$PLUGINSDIR\window-frame.dll::InstallerReportExtractFailure(p $HWNDPARENT, i R0, w "${Archive}", w "$dshNewDirectory", w "$PLUGINSDIR\extract.log", w r0, i r1, w "$(^SetupCaption)", w "$InstallerTextExtractFailed", w "$InstallerTextExtractHint", w "$InstallerTextExtractCopy", w "$InstallerTextExtractExpand", w "$InstallerTextExtractCollapse", w "$InstallerTextExtractSaved", w "$InstallerTextExtractUnsaved", w "$InstallerTextExtractCopied") i.r2 ?c'
  ${If} $2 == 1
    DetailPrint $0
  ${EndIf}
  Pop $6
  Pop $5
  Pop $4
  Pop $3
  Pop $2
  Pop $1
  Pop $0
!macroend

!macro customCheckAppRunning
  !ifdef BUILD_UNINSTALLER
    InitPluginsDir
    File "/oname=$PLUGINSDIR\window-frame.dll" "${INSTALLER_BUILD_DIR}\window-frame.dll"
  !endif
  System::Call '$PLUGINSDIR\window-frame.dll::InstallerFindProcess(w "$INSTDIR\${APP_EXECUTABLE_FILENAME}") i.R0 ?c'
  ${If} $R0 == 0
    ${If} ${isUpdated}
      StrCpy $R1 0
      ${DoWhile} $R0 == 0
        Sleep 250
        System::Call '$PLUGINSDIR\window-frame.dll::InstallerFindProcess(w "$INSTDIR\${APP_EXECUTABLE_FILENAME}") i.R0 ?c'
        IntOp $R1 $R1 + 1
        ${If} $R1 >= 40
          ${ExitDo}
        ${EndIf}
      ${Loop}
    ${EndIf}
    ${If} $R0 == 0
      !ifdef BUILD_UNINSTALLER
        MessageBox MB_OK|MB_ICONINFORMATION "$(INSTALLER_RUNNING)" /SD IDOK
      !else
        MessageBox MB_OK|MB_ICONINFORMATION "$InstallerTextRunning" /SD IDOK
      !endif
      SetErrorLevel 2
      Quit
    ${EndIf}
  ${EndIf}
  ${If} $R0 < 0
    !ifdef BUILD_UNINSTALLER
      MessageBox MB_OK|MB_ICONEXCLAMATION "$(INSTALLER_UI_ERROR)" /SD IDOK
    !else
      MessageBox MB_OK|MB_ICONEXCLAMATION "$InstallerTextUiError" /SD IDOK
    !endif
    SetErrorLevel 2
    Quit
  ${EndIf}
!macroend

!macro customInstallerDirectoryFailed
  Push $0
  Push $1
  Push $2
  Push $3
  Push $4
  Push $5
  Push $6
  ${GetTime} "" "L" $0 $1 $2 $3 $4 $5 $6
  StrCpy $0 "$dshDirectoryLogDirectory\directory-failure-$2$1$0-$4$5$6.log"
  StrCpy $1 1
  ${If} ${Silent}
    StrCpy $1 0
  ${EndIf}
  StrCpy $3 "$InstallerTextDirectoryHint"
  ${If} $dshRestoreError != 0
    StrCpy $3 "$InstallerTextDirectoryRestoreHint"
  ${EndIf}
  System::Call '$PLUGINSDIR\window-frame.dll::InstallerReportDirectoryFailure(p $HWNDPARENT, i $dshDirectoryError, w "$dshDirectorySource", w "$dshDirectoryDestination", i $dshRestoreError, w "$dshOldDirectory", w "$PLUGINSDIR\directory-operations.log", w r0, i r1, w "$(^SetupCaption)", w "$InstallerTextDirectoryFailed", w r3, w "$InstallerTextExtractCopy", w "$InstallerTextExtractExpand", w "$InstallerTextExtractCollapse", w "$InstallerTextExtractSaved", w "$InstallerTextExtractUnsaved", w "$InstallerTextExtractCopied") i.r2 ?c'
  ${If} $2 == 1
    DetailPrint $0
  ${EndIf}
  Pop $6
  Pop $5
  Pop $4
  Pop $3
  Pop $2
  Pop $1
  Pop $0
!macroend

!ifndef BUILD_UNINSTALLER
  !include "${__FILEDIR__}\installer-directories.nsh"
!endif

!macro customInstall
  Push $0
  Push $1
  Push $R0
  StrCpy $0 0
  ${If} ${Errors}
    StrCpy $0 1
  ${EndIf}
  !insertmacro InstallerPublishStage 4
  ; The desktop adopts this one-shot seed as its locale.preference on first launch.
  StrCpy $1 "en"
  !ifdef LANG_RUSSIAN
    ${If} $LANGUAGE == ${LANG_RUSSIAN}
      StrCpy $1 "ru"
    ${EndIf}
  !endif
  FileOpen $R0 "$INSTDIR\installer-locale" w
  FileWrite $R0 "$1"
  FileClose $R0
  !insertmacro dshFinishDirectories
  ; Standard uninstall-entry metadata read by inventory tools; the upstream template records it only under its private key.
  WriteRegStr SHELL_CONTEXT "${UNINSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
  ${If} $0 == 1
    SetErrors
  ${Else}
    ClearErrors
  ${EndIf}
  Pop $R0
  Pop $1
  Pop $0
!macroend
