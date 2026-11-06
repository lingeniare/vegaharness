; Native welcome and finish pages for the electron-builder installer.
!ifndef HARNESS_INSTALLER_UI
!define HARNESS_INSTALLER_UI
!define WM_NOTIFY_OUTER_NEXT 0x408

Var InstallerDialog
Var InstallerPhase
Var InstallerDpi
Var InstallerSize
Var InstallerImage
Var InstallerButton
Var InstallerStatus
Var InstallerFont
Var InstallerSmallFont
Var InstallerChoose
Var InstallerEdit
Var InstallerEditFrame
Var InstallerBrowse
Var InstallerLaunch
Var InstallerExpanded
Var InstallerMinimizeButton
Var InstallerCloseButton
!macro InstallerAssignLocale LOCALE_ID
    StrCpy $InstallerTextBrowse "$(INSTALLER_BROWSE_${LOCALE_ID})"
    StrCpy $InstallerTextChoosePath "$(INSTALLER_CHOOSE_PATH_${LOCALE_ID})"
    StrCpy $InstallerTextDirectoryFailed "$(INSTALLER_DIRECTORY_FAILED_${LOCALE_ID})"
    StrCpy $InstallerTextDirectoryHint "$(INSTALLER_DIRECTORY_HINT_${LOCALE_ID})"
    StrCpy $InstallerTextDirectoryRestoreHint "$(INSTALLER_DIRECTORY_RESTORE_HINT_${LOCALE_ID})"
    StrCpy $InstallerTextDiskSpace "$(INSTALLER_DISK_SPACE_${LOCALE_ID})"
    StrCpy $InstallerTextExtractCollapse "$(INSTALLER_EXTRACT_COLLAPSE_${LOCALE_ID})"
    StrCpy $InstallerTextExtractCopied "$(INSTALLER_EXTRACT_COPIED_${LOCALE_ID})"
    StrCpy $InstallerTextExtractCopy "$(INSTALLER_EXTRACT_COPY_${LOCALE_ID})"
    StrCpy $InstallerTextExtractExpand "$(INSTALLER_EXTRACT_EXPAND_${LOCALE_ID})"
    StrCpy $InstallerTextExtractFailed "$(INSTALLER_EXTRACT_FAILED_${LOCALE_ID})"
    StrCpy $InstallerTextExtractHint "$(INSTALLER_EXTRACT_HINT_${LOCALE_ID})"
    StrCpy $InstallerTextExtractSaved "$(INSTALLER_EXTRACT_SAVED_${LOCALE_ID})"
    StrCpy $InstallerTextExtractUnsaved "$(INSTALLER_EXTRACT_UNSAVED_${LOCALE_ID})"
    StrCpy $InstallerTextFailed "$(INSTALLER_FAILED_${LOCALE_ID})"
    StrCpy $InstallerTextFinish "$(INSTALLER_FINISH_${LOCALE_ID})"
    StrCpy $InstallerTextInstall "$(INSTALLER_INSTALL_${LOCALE_ID})"
    StrCpy $InstallerTextLaunch "$(INSTALLER_LAUNCH_${LOCALE_ID})"
    StrCpy $InstallerTextLaunchFailed "$(INSTALLER_LAUNCH_FAILED_${LOCALE_ID})"
    StrCpy $InstallerTextNativeProgress "$(INSTALLER_NATIVE_PROGRESS_${LOCALE_ID})"
    StrCpy $InstallerTextPathInvalid "$(INSTALLER_PATH_INVALID_${LOCALE_ID})"
    StrCpy $InstallerTextPathOwnership "$(INSTALLER_PATH_OWNERSHIP_${LOCALE_ID})"
    StrCpy $InstallerTextPathWritable "$(INSTALLER_PATH_WRITABLE_${LOCALE_ID})"
    StrCpy $InstallerTextProgressClean "$(INSTALLER_PROGRESS_CLEAN_${LOCALE_ID})"
    StrCpy $InstallerTextProgressCopy "$(INSTALLER_PROGRESS_COPY_${LOCALE_ID})"
    StrCpy $InstallerTextProgressExtract "$(INSTALLER_PROGRESS_EXTRACT_${LOCALE_ID})"
    StrCpy $InstallerTextProgressRegister "$(INSTALLER_PROGRESS_REGISTER_${LOCALE_ID})"
    StrCpy $InstallerTextRunning "$(INSTALLER_RUNNING_${LOCALE_ID})"
    StrCpy $InstallerTextUiError "$(INSTALLER_UI_ERROR_${LOCALE_ID})"
!macroend
!macro InstallerAssignLocaleCurrent
    StrCpy $InstallerTextBrowse "$(INSTALLER_BROWSE)"
    StrCpy $InstallerTextChoosePath "$(INSTALLER_CHOOSE_PATH)"
    StrCpy $InstallerTextDirectoryFailed "$(INSTALLER_DIRECTORY_FAILED)"
    StrCpy $InstallerTextDirectoryHint "$(INSTALLER_DIRECTORY_HINT)"
    StrCpy $InstallerTextDirectoryRestoreHint "$(INSTALLER_DIRECTORY_RESTORE_HINT)"
    StrCpy $InstallerTextDiskSpace "$(INSTALLER_DISK_SPACE)"
    StrCpy $InstallerTextExtractCollapse "$(INSTALLER_EXTRACT_COLLAPSE)"
    StrCpy $InstallerTextExtractCopied "$(INSTALLER_EXTRACT_COPIED)"
    StrCpy $InstallerTextExtractCopy "$(INSTALLER_EXTRACT_COPY)"
    StrCpy $InstallerTextExtractExpand "$(INSTALLER_EXTRACT_EXPAND)"
    StrCpy $InstallerTextExtractFailed "$(INSTALLER_EXTRACT_FAILED)"
    StrCpy $InstallerTextExtractHint "$(INSTALLER_EXTRACT_HINT)"
    StrCpy $InstallerTextExtractSaved "$(INSTALLER_EXTRACT_SAVED)"
    StrCpy $InstallerTextExtractUnsaved "$(INSTALLER_EXTRACT_UNSAVED)"
    StrCpy $InstallerTextFailed "$(INSTALLER_FAILED)"
    StrCpy $InstallerTextFinish "$(INSTALLER_FINISH)"
    StrCpy $InstallerTextInstall "$(INSTALLER_INSTALL)"
    StrCpy $InstallerTextLaunch "$(INSTALLER_LAUNCH)"
    StrCpy $InstallerTextLaunchFailed "$(INSTALLER_LAUNCH_FAILED)"
    StrCpy $InstallerTextNativeProgress "$(INSTALLER_NATIVE_PROGRESS)"
    StrCpy $InstallerTextPathInvalid "$(INSTALLER_PATH_INVALID)"
    StrCpy $InstallerTextPathOwnership "$(INSTALLER_PATH_OWNERSHIP)"
    StrCpy $InstallerTextPathWritable "$(INSTALLER_PATH_WRITABLE)"
    StrCpy $InstallerTextProgressClean "$(INSTALLER_PROGRESS_CLEAN)"
    StrCpy $InstallerTextProgressCopy "$(INSTALLER_PROGRESS_COPY)"
    StrCpy $InstallerTextProgressExtract "$(INSTALLER_PROGRESS_EXTRACT)"
    StrCpy $InstallerTextProgressRegister "$(INSTALLER_PROGRESS_REGISTER)"
    StrCpy $InstallerTextRunning "$(INSTALLER_RUNNING)"
    StrCpy $InstallerTextUiError "$(INSTALLER_UI_ERROR)"
!macroend
; The welcome selector exists only when both shipped languages are compiled in;
; single-language test builds keep every flag path compiled out.
!ifdef LANG_ENGLISH
    !ifdef LANG_RUSSIAN
        !define INSTALLER_LANGUAGE_SELECTOR
        Var InstallerLanguageEn
        Var InstallerLanguageRu
    !endif
!endif
!include "${__FILEDIR__}\path.nsh"
!include "${__FILEDIR__}\drawing.nsh"

; All layout values are 96-DPI logical pixels.
!macro InstallerPlace HWND X Y W H
    System::Call 'kernel32::MulDiv(i ${X}, i $InstallerDpi, i 96) i.r0'
    System::Call 'kernel32::MulDiv(i ${Y}, i $InstallerDpi, i 96) i.r1'
    System::Call 'kernel32::MulDiv(i ${W}, i $InstallerDpi, i 96) i.r2'
    System::Call 'kernel32::MulDiv(i ${H}, i $InstallerDpi, i 96) i.r3'
    System::Call 'user32::MoveWindow(p ${HWND}, i r0, i r1, i r2, i r3, i 1)'
!macroend

; Localized captions vary in length; fixed Figma widths clip them on other-language systems.
; Stack in: HFONT, text. Stack out: drawn width in device pixels.
Function InstallerTextWidth
    Pop $R0
    Pop $R1
    System::Call 'user32::GetDC(p 0) p.r4'
    System::Call 'gdi32::SelectObject(p r4, p R1) p.r5'
    StrLen $0 $R0
    System::Alloc 8
    Pop $6
    System::Call 'gdi32::GetTextExtentPoint32W(p r4, w R0, i r0, p r6)'
    System::Call '*$6(i .r7)'
    System::Free $6
    System::Call 'gdi32::SelectObject(p r4, p r5)'
    System::Call 'user32::ReleaseDC(p 0, p r4)'
    Push $7
FunctionEnd

; Stack in: hwnd, HFONT, caption A, caption B ("" to skip), logical minimum width,
; logical side padding, logical y, logical height. The button stays horizontally centered.
Function InstallerFitButton
    Pop $R8
    Pop $R7
    Pop $R6
    Pop $R5
    Pop $R4
    Pop $R3
    Pop $R2
    Pop $R9
    Push $R2
    Push $R3
    Call InstallerTextWidth
    Pop $R3
    ${If} $R4 != ""
        Push $R2
        Push $R4
        Call InstallerTextWidth
        Pop $0
        ${If} $R3 < $0
            StrCpy $R3 $0
        ${EndIf}
    ${EndIf}
    System::Call 'kernel32::MulDiv(i R6, i $InstallerDpi, i 96) i.r0'
    IntOp $R3 $R3 + $0
    IntOp $R3 $R3 + $0
    System::Call 'kernel32::MulDiv(i R5, i $InstallerDpi, i 96) i.r0'
    ${If} $R3 < $0
        StrCpy $R3 $0
    ${EndIf}
    IntOp $0 $InstallerSize - $R3
    IntOp $0 $0 / 2
    System::Call 'kernel32::MulDiv(i R7, i $InstallerDpi, i 96) i.r4'
    System::Call 'kernel32::MulDiv(i R8, i $InstallerDpi, i 96) i.r5'
    System::Call 'user32::MoveWindow(p R9, i r0, i r4, i R3, i r5, i 1)'
FunctionEnd

; The launch checkbox row centers a fixed box plus its localized caption.
; Stack in: hwnd.
Function InstallerFitLaunch
    Pop $R9
    Push $InstallerSmallFont
    Push "$InstallerTextLaunch"
    Call InstallerTextWidth
    Pop $7
    System::Call 'kernel32::MulDiv(i 42, i $InstallerDpi, i 96) i.r2'
    IntOp $2 $2 + $7
    IntOp $0 $InstallerSize - $2
    IntOp $0 $0 / 2
    System::Call 'kernel32::MulDiv(i 438, i $InstallerDpi, i 96) i.r1'
    System::Call 'kernel32::MulDiv(i 32, i $InstallerDpi, i 96) i.r3'
    System::Call 'user32::MoveWindow(p R9, i r0, i r1, i r2, i r3, i 1)'
FunctionEnd

!ifdef INSTALLER_LANGUAGE_SELECTOR
; The flag buttons re-localize every custom-page string; widths are remeasured
; because captions differ across languages. Stack in: NSIS language id.
Function InstallerApplyLanguage
    Pop $R0
    ${If} $LANGUAGE == $R0
        Return
    ${EndIf}
    StrCpy $LANGUAGE $R0
    ${If} $R0 == ${LANG_RUSSIAN}
        !insertmacro InstallerAssignLocale ru_RU
    ${Else}
        !insertmacro InstallerAssignLocale en_US
    ${EndIf}
    ${NSD_SetText} $InstallerChoose "$InstallerTextChoosePath"
    Push $InstallerChoose
    Push $InstallerSmallFont
    Push "$InstallerTextChoosePath"
    Push ""
    Push 136
    Push 14
    Push 438
    Push 28
    Call InstallerFitButton
    ${NSD_SetText} $InstallerBrowse "$InstallerTextBrowse"
    ${NSD_SetText} $InstallerLaunch "$InstallerTextLaunch"
    Push $InstallerLaunch
    Call InstallerFitLaunch
    ${If} $InstallerPhase == "success"
        ${NSD_SetText} $InstallerButton "$InstallerTextFinish"
    ${Else}
        ${NSD_SetText} $InstallerButton "$InstallerTextInstall"
    ${EndIf}
    Push $InstallerButton
    Push $InstallerFont
    Push "$InstallerTextInstall"
    Push "$InstallerTextFinish"
    Push ${INSTALLER_BUTTON_WIDTH}
    Push 20
    Push ${INSTALLER_BUTTON_Y}
    Push ${INSTALLER_BUTTON_HEIGHT}
    Call InstallerFitButton
    ${If} $InstallerPhase == "welcome"
    ${AndIf} $InstallerExpanded == 1
        Call InstallerValidateEditedPath
    ${EndIf}
    ${If} $InstallerLanguageEn <> 0
        System::Call 'user32::InvalidateRect(p $InstallerLanguageEn, p 0, i 1)'
    ${EndIf}
    ${If} $InstallerLanguageRu <> 0
        System::Call 'user32::InvalidateRect(p $InstallerLanguageRu, p 0, i 1)'
    ${EndIf}
    System::Call 'user32::InvalidateRect(p $InstallerLaunch, p 0, i 1)'
FunctionEnd

Function InstallerLanguageEnglish
    Pop $0
    Push ${LANG_ENGLISH}
    Call InstallerApplyLanguage
FunctionEnd

Function InstallerLanguageRussian
    Pop $0
    Push ${LANG_RUSSIAN}
    Call InstallerApplyLanguage
FunctionEnd
!endif

Function InstallerCreate
    !ifdef INSTALLER_LANGUAGE_SELECTOR
        ${If} $LANGUAGE == ${LANG_RUSSIAN}
            !insertmacro InstallerAssignLocale ru_RU
        ${Else}
            !insertmacro InstallerAssignLocale en_US
        ${EndIf}
    !else
        !insertmacro InstallerAssignLocaleCurrent
    !endif
    nsDialogs::Create 1018
    Pop $InstallerDialog
    ${If} $InstallerDialog == error
        Abort
    ${EndIf}
    !insertmacro InstallerPlace $InstallerDialog 0 0 ${INSTALLER_WINDOW_SIZE} ${INSTALLER_WINDOW_SIZE}
    !insertmacro InstallerControlColors $HWNDPARENT
    !insertmacro InstallerControlColors $InstallerDialog
    !insertmacro InstallerPixelFont $InstallerFont ${INSTALLER_BUTTON_FONT_SIZE} 500
    !insertmacro InstallerPixelFont $InstallerSmallFont ${INSTALLER_STATUS_FONT_SIZE} 400
    System::Call '*(i 1, p 0, i 0, i 0) p.r0'
    System::Call 'gdiplus::GdiplusStartup(*p .r1, p r0, p 0) i.r2'
    StrCpy $InstallerGdiToken $1
    System::Free $0
    ${If} $2 != 0
        MessageBox MB_OK|MB_ICONSTOP "$InstallerTextUiError"
        SetErrorLevel 2
        Quit
    ${EndIf}

    ${NSD_CreateLabel} 0 0 0 0 ""
    Pop $4
    !insertmacro InstallerPlace $4 0 0 504 48
    ${NSD_AddStyle} $4 ${SS_NOTIFY}
    ${NSD_OnClick} $4 InstallerDrag
    !insertmacro InstallerControlColors $4
    ${NSD_CreateButton} 0 0 0 0 "−"
    Pop $4
    StrCpy $InstallerMinimizeButton $4
    !insertmacro InstallerPlace $4 504 8 40 32
    ${NSD_OnClick} $4 InstallerMinimize
    ${NSD_OnNotify} $4 InstallerPaintButton
    ${NSD_CreateButton} 0 0 0 0 "×"
    Pop $4
    StrCpy $InstallerCloseButton $4
    !insertmacro InstallerPlace $4 548 8 40 32
    ${NSD_OnClick} $4 InstallerClose
    ${NSD_OnNotify} $4 InstallerPaintButton

    ${NSD_CreateBitmap} 0 0 0 0 ""
    Pop $4
    !insertmacro InstallerPlace $4 0 ${INSTALLER_BRAND_Y} ${INSTALLER_WINDOW_SIZE} ${INSTALLER_BRAND_HEIGHT}
    StrCpy $5 "brand"
    ${If} $InstallerTheme == "dark"
        StrCpy $5 "brand-dark"
    ${EndIf}
    ${If} $InstallerDpi <= 96
        ${NSD_SetStretchedImage} $4 "$PLUGINSDIR\$5.bmp" $InstallerImage
    ${Else}
        ${NSD_SetStretchedImage} $4 "$PLUGINSDIR\$5-2x.bmp" $InstallerImage
    ${EndIf}

    ${NSD_CreateLabel} 0 0 0 0 ""
    Pop $InstallerStatus
    !insertmacro InstallerPlace $InstallerStatus 48 ${INSTALLER_STATUS_Y} 504 ${INSTALLER_STATUS_HEIGHT}
    ${NSD_AddStyle} $InstallerStatus ${SS_CENTER}|${SS_CENTERIMAGE}
    SendMessage $InstallerStatus ${WM_SETFONT} $InstallerSmallFont 1
    !insertmacro InstallerControlColors $InstallerStatus

    ${NSD_CreateButton} 0 0 0 0 "$InstallerTextChoosePath"
    Pop $InstallerChoose
    SendMessage $InstallerChoose ${WM_SETFONT} $InstallerSmallFont 1
    Push $InstallerChoose
    Push $InstallerSmallFont
    Push "$InstallerTextChoosePath"
    Push ""
    Push 136
    Push 14
    Push 438
    Push 28
    Call InstallerFitButton
    ${NSD_OnClick} $InstallerChoose InstallerExpandPath
    ${NSD_OnNotify} $InstallerChoose InstallerPaintButton
    ${NSD_CreateBitmap} 0 0 0 0 ""
    Pop $InstallerEditFrame
    !insertmacro InstallerPlace $InstallerEditFrame 64 434 384 34
    Call InstallerDrawEditFrame
    ${NSD_CreateText} 0 0 0 0 "$InstallerPath"
    Pop $InstallerEdit
    System::Call 'user32::GetWindowLongW(p $InstallerEdit, i -16) i.r0'
    IntOp $0 $0 & 0xFF7FFFFF
    System::Call 'user32::SetWindowLongW(p $InstallerEdit, i -16, i r0)'
    System::Call 'user32::GetWindowLongW(p $InstallerEdit, i -20) i.r0'
    IntOp $0 $0 & 0xFFFFFDFF
    System::Call 'user32::SetWindowLongW(p $InstallerEdit, i -20, i r0)'
    SendMessage $InstallerEdit ${WM_SETFONT} $InstallerSmallFont 1
    ; A borderless single-line edit sits inside a separate padded frame.
    System::Call 'user32::GetDC(p $InstallerEdit) p.r4'
    System::Call 'gdi32::SelectObject(p r4, p $InstallerSmallFont) p.r5'
    System::Alloc 60
    Pop $6
    System::Call 'gdi32::GetTextMetricsW(p r4, p r6)'
    System::Call '*$6(i .r7)'
    System::Free $6
    System::Call 'gdi32::SelectObject(p r4, p r5)'
    System::Call 'user32::ReleaseDC(p $InstallerEdit, p r4)'
    System::Call 'kernel32::MulDiv(i 76, i $InstallerDpi, i 96) i.r0'
    System::Call 'kernel32::MulDiv(i 434, i $InstallerDpi, i 96) i.r1'
    System::Call 'kernel32::MulDiv(i 360, i $InstallerDpi, i 96) i.r2'
    System::Call 'kernel32::MulDiv(i 34, i $InstallerDpi, i 96) i.r3'
    IntOp $3 $3 - $7
    IntOp $3 $3 / 2
    IntOp $1 $1 + $3
    System::Call 'user32::MoveWindow(p $InstallerEdit, i r0, i r1, i r2, i r7, i 1)'
    System::Call 'user32::SetWindowPos(p $InstallerEdit, p 0, i 0, i 0, i 0, i 0, i 0x33)'
    SendMessage $InstallerEdit ${EM_SETLIMITTEXT} 180 0
    !insertmacro InstallerControlColors $InstallerEdit
    ${NSD_OnChange} $InstallerEdit InstallerPathChanged
    ${NSD_CreateButton} 0 0 0 0 "$InstallerTextBrowse"
    Pop $InstallerBrowse
    SendMessage $InstallerBrowse ${WM_SETFONT} $InstallerSmallFont 1
    !insertmacro InstallerPlace $InstallerBrowse 456 434 80 34
    ${NSD_OnClick} $InstallerBrowse InstallerBrowsePath
    ${NSD_OnNotify} $InstallerBrowse InstallerPaintButton
    ${NSD_CreateCheckbox} 0 0 0 0 "$InstallerTextLaunch"
    Pop $InstallerLaunch
    SendMessage $InstallerLaunch ${WM_SETFONT} $InstallerSmallFont 1
    Push $InstallerLaunch
    Call InstallerFitLaunch
    !insertmacro InstallerControlColors $InstallerLaunch
    ${NSD_OnNotify} $InstallerLaunch InstallerPaintCheckbox
    ${NSD_Check} $InstallerLaunch

    !ifdef INSTALLER_LANGUAGE_SELECTOR
        ; The selector sits above Choose location; the flag alone is painted while the
        ; caption stays as the accessible name for UI automation and screen readers.
        IntOp $9 ${INSTALLER_LANGUAGE_WIDTH} * 2
        IntOp $9 $9 + ${INSTALLER_LANGUAGE_GAP}
        IntOp $9 ${INSTALLER_WINDOW_SIZE} - $9
        IntOp $9 $9 / 2
        ${NSD_CreateButton} 0 0 0 0 "$(INSTALLER_LANGUAGE_EN)"
        Pop $InstallerLanguageEn
        !insertmacro InstallerPlace $InstallerLanguageEn $9 ${INSTALLER_LANGUAGE_Y} ${INSTALLER_LANGUAGE_WIDTH} ${INSTALLER_LANGUAGE_HEIGHT}
        ${NSD_OnClick} $InstallerLanguageEn InstallerLanguageEnglish
        ${NSD_OnNotify} $InstallerLanguageEn InstallerPaintFlag
        IntOp $9 $9 + ${INSTALLER_LANGUAGE_WIDTH}
        IntOp $9 $9 + ${INSTALLER_LANGUAGE_GAP}
        ${NSD_CreateButton} 0 0 0 0 "$(INSTALLER_LANGUAGE_RU)"
        Pop $InstallerLanguageRu
        !insertmacro InstallerPlace $InstallerLanguageRu $9 ${INSTALLER_LANGUAGE_Y} ${INSTALLER_LANGUAGE_WIDTH} ${INSTALLER_LANGUAGE_HEIGHT}
        ${NSD_OnClick} $InstallerLanguageRu InstallerLanguageRussian
        ${NSD_OnNotify} $InstallerLanguageRu InstallerPaintFlag
    !endif

    ${NSD_CreateButton} 0 0 0 0 "$InstallerTextInstall"
    Pop $InstallerButton
    SendMessage $InstallerButton ${WM_SETFONT} $InstallerFont 1
    Push $InstallerButton
    Push $InstallerFont
    Push "$InstallerTextInstall"
    Push "$InstallerTextFinish"
    Push ${INSTALLER_BUTTON_WIDTH}
    Push 20
    Push ${INSTALLER_BUTTON_Y}
    Push ${INSTALLER_BUTTON_HEIGHT}
    Call InstallerFitButton
    ${NSD_OnClick} $InstallerButton InstallerStart
    ${NSD_OnNotify} $InstallerButton InstallerPaintButton
    Call InstallerRender
    System::Call 'user32::SetPropW(p $HWNDPARENT, w "HarnessInstaller.Ready", p 1)'
    ShowWindow $InstallerDialog 5
    ShowWindow $HWNDPARENT 5
    ${If} $InstallerPhase == "welcome"
        System::Call '$PLUGINSDIR\window-frame.dll::InstallerPresentWelcome(p $HWNDPARENT) i.r0 ?c'
    ${EndIf}
    nsDialogs::Show
    ${NSD_KillTimer} InstallerValidateEditedPath
    ${NSD_FreeImage} $InstallerImage
    ${NSD_FreeImage} $InstallerEditFrameBitmap
    System::Call 'gdiplus::GdiplusShutdown(p $InstallerGdiToken)'
    System::Call 'gdi32::DeleteObject(p $InstallerFont)'
    System::Call 'gdi32::DeleteObject(p $InstallerSmallFont)'
FunctionEnd

Function InstallerRender
    ShowWindow $InstallerChoose 0
    ShowWindow $InstallerEdit 0
    ShowWindow $InstallerEditFrame 0
    ShowWindow $InstallerBrowse 0
    ShowWindow $InstallerLaunch 0
    ShowWindow $InstallerStatus 0
    !ifdef INSTALLER_LANGUAGE_SELECTOR
        ShowWindow $InstallerLanguageEn 0
        ShowWindow $InstallerLanguageRu 0
    !endif
    ${If} $InstallerPhase == "success"
        ${NSD_SetText} $InstallerButton "$InstallerTextFinish"
        ShowWindow $InstallerLaunch 5
    ${Else}
        ${NSD_SetText} $InstallerButton "$InstallerTextInstall"
        !ifdef INSTALLER_LANGUAGE_SELECTOR
            ShowWindow $InstallerLanguageEn 5
            ShowWindow $InstallerLanguageRu 5
        !endif
        ${If} $InstallerExpanded == 1
            ShowWindow $InstallerEditFrame 5
            ShowWindow $InstallerEdit 5
            ShowWindow $InstallerBrowse 5
        ${Else}
            ShowWindow $InstallerChoose 5
        ${EndIf}
    ${EndIf}
FunctionEnd

Function InstallerStart
    Pop $0
    SendMessage $HWNDPARENT ${WM_NOTIFY_OUTER_NEXT} 1 0
FunctionEnd

; Page leave callbacks also run when Enter activates NSIS's hidden default button.
Function InstallerWelcomeLeave
    ${NSD_GetText} $InstallerEdit $InstallerPath
    Call InstallerPreflight
    ${If} $InstallerError != ""
        MessageBox MB_OK|MB_ICONEXCLAMATION "$InstallerError"
        Abort
    ${EndIf}
FunctionEnd

Function InstallerFinishLeave
    ${NSD_GetState} $InstallerLaunch $0
    HideWindow
    ${If} $0 == ${BST_CHECKED}
        StrCpy $0 ""
        ${If} ${isUpdated}
            StrCpy $0 "--updated"
        ${EndIf}
        ClearErrors
        ${If} ${UAC_IsAdmin}
            ; An explicitly elevated installer must still launch through the user's shell.
            ${StdUtils.ExecShellAsUser} $1 "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "open" "$0"
            ${If} $1 != "ok"
            ${AndIf} $1 != "fallback"
                SetErrors
            ${EndIf}
        ${Else}
            ; Per-user installation can create the process without Explorer/shortcut dispatch.
            Exec '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" $0'
        ${EndIf}
        ${If} ${Errors}
            ShowWindow $HWNDPARENT 5
            MessageBox MB_OK|MB_ICONEXCLAMATION "$InstallerTextLaunchFailed"
            Abort
        ${EndIf}
    ${EndIf}
FunctionEnd

Function InstallerExpandPath
    Pop $0
    StrCpy $InstallerExpanded 1
    Call InstallerRender
    SendMessage $InstallerEdit ${EM_SETSEL} 0 0
    System::Call 'user32::SetFocus(p $InstallerEdit)'
FunctionEnd

Function InstallerPathChanged
    Pop $0
    ${NSD_CreateTimer} InstallerValidateEditedPath 450
FunctionEnd

Function InstallerValidateEditedPath
    ${NSD_KillTimer} InstallerValidateEditedPath
    ${If} $InstallerPhase != "welcome"
        Return
    ${EndIf}
    ${NSD_GetText} $InstallerEdit $InstallerPath
    Call InstallerValidatePath
    ${NSD_SetText} $InstallerStatus "$InstallerError"
    !insertmacro InstallerPlace $InstallerStatus 48 542 504 42
    ShowWindow $InstallerStatus 5
FunctionEnd

Function InstallerBrowsePath
    Pop $0
    nsDialogs::SelectFolderDialog "$InstallerTextChoosePath" "$InstallerPath"
    Pop $0
    ${If} $0 != "error"
        ${NSD_SetText} $InstallerEdit "$0"
        Call InstallerValidateEditedPath
    ${EndIf}
FunctionEnd

Function InstallerDrag
    Pop $0
    System::Call 'user32::ReleaseCapture()'
    SendMessage $HWNDPARENT ${WM_NCLBUTTONDOWN} 2 0
FunctionEnd

; NM_CUSTOMDRAW keeps native button focus, keyboard input and accessible text.
; This NMCUSTOMDRAW layout is for the x86 NSIS stub, including on x64 Windows.
Function InstallerPaintButton
    Pop $R0
    Pop $R1
    Pop $R2
    ${If} $R1 != -12
        Return
    ${EndIf}
    System::Call '*$R2(p, p, i, i .R3, p .R4, i .R5, i .R6, i .R7, i .R8, p, i .R9)'
    ${If} $R3 != 1
        Return
    ${EndIf}
    System::Call 'gdi32::SaveDC(p R4)'
    System::Alloc 16
    Pop $R2
    System::Call 'user32::GetClientRect(p R0, p R2)'
    System::Call 'gdi32::CreateSolidBrush(i $InstallerBgColorref) p.R3'
    System::Call 'user32::FillRect(p R4, p R2, p R3)'
    System::Call 'gdi32::DeleteObject(p R3)'
    StrCpy $R3 $InstallerBgArgb
    ${If} $R0 == $InstallerButton
        StrCpy $R3 $InstallerPrimary
        IntOp $R1 $R9 & 64
        ${If} $R1 != 0
            StrCpy $R3 $InstallerPrimaryHover
        ${EndIf}
        IntOp $R1 $R9 & 1
        ${If} $R1 != 0
            StrCpy $R3 $InstallerPrimaryPressed
        ${EndIf}
    ${Else}
        IntOp $R1 $R9 & 64
        ${If} $R1 != 0
            StrCpy $R3 $InstallerControlHover
        ${EndIf}
        IntOp $R1 $R9 & 1
        ${If} $R1 != 0
            StrCpy $R3 $InstallerControlPressed
        ${EndIf}
    ${EndIf}
    System::Call 'gdiplus::GdipCreateSolidFill(i R3, *p .R1)'
    System::Call 'gdiplus::GdipCreateFromHDC(p R4, *p .R5)'
    System::Call 'gdiplus::GdipSetSmoothingMode(p R5, i 4)'
    System::Call 'gdiplus::GdipSetPixelOffsetMode(p R5, i 4)'
    System::Call 'kernel32::MulDiv(i ${INSTALLER_BUTTON_DIAMETER}, i $InstallerDpi, i 96) i.R3'
    ${If} $R0 == $InstallerBrowse
        System::Call 'kernel32::MulDiv(i 12, i $InstallerDpi, i 96) i.R3'
    ${EndIf}
    !insertmacro InstallerRoundPath $R6 $R7 $R8 $R3
    System::Call 'gdiplus::GdipFillPath(p R5, p R1, p R6)'
    ${If} $R0 == $InstallerBrowse
        System::Call 'gdiplus::GdipCreatePen1(i $InstallerBorder, i 0x40000000, i 2, *p .r2)'
        System::Call 'gdiplus::GdipDrawPath(p R5, p r2, p R6)'
        System::Call 'gdiplus::GdipDeletePen(p r2)'
    ${EndIf}
    System::Call 'gdiplus::GdipDeletePath(p R6)'
    System::Call 'gdiplus::GdipDeleteGraphics(p R5)'
    System::Call 'gdiplus::GdipDeleteBrush(p R1)'
    System::Call 'gdi32::SetBkMode(p R4, i 1)'
    ${If} $R0 == $InstallerButton
        System::Call 'gdi32::SetTextColor(p R4, i $InstallerButtonText)'
    ${Else}
        System::Call 'gdi32::SetTextColor(p R4, i $InstallerTextColorref)'
    ${EndIf}
    System::Call 'gdi32::SelectObject(p R4, p $InstallerFont)'
    ${If} $R0 == $InstallerChoose
    ${OrIf} $R0 == $InstallerBrowse
        System::Call 'gdi32::SelectObject(p R4, p $InstallerSmallFont)'
    ${EndIf}
    ${NSD_GetText} $R0 $R3
    System::Call 'user32::DrawTextW(p R4, w R3, i -1, p R2, i 0x25)'
    IntOp $R9 $R9 & 16
    ${If} $R9 != 0
        System::Call 'user32::InflateRect(p R2, i -4, i -4)'
        System::Call 'user32::DrawFocusRect(p R4, p R2)'
    ${EndIf}
    System::Call 'gdi32::RestoreDC(p R4, i -1)'
    System::Free $R2
    ${NSD_Return} 4
FunctionEnd

!ifdef INSTALLER_LANGUAGE_SELECTOR
; Flag buttons paint a flag inset inside the button and ring the active language.
Function InstallerPaintFlag
    Pop $R0
    Pop $R1
    Pop $R2
    ${If} $R1 != -12
        Return
    ${EndIf}
    System::Call '*$R2(p, p, i, i .R3, p .R4, i .R5, i .R6, i .R7, i .R8, p, i .R9)'
    ${If} $R3 != 1
        Return
    ${EndIf}
    StrCpy $R1 0
    !ifdef LANG_ENGLISH
        ${If} $R0 == $InstallerLanguageEn
        ${AndIf} $LANGUAGE == ${LANG_ENGLISH}
            StrCpy $R1 1
        ${EndIf}
    !endif
    !ifdef LANG_RUSSIAN
        ${If} $R0 == $InstallerLanguageRu
        ${AndIf} $LANGUAGE == ${LANG_RUSSIAN}
            StrCpy $R1 1
        ${EndIf}
    !endif
    System::Call 'gdi32::SaveDC(p R4)'
    System::Alloc 16
    Pop $R2
    System::Call 'user32::GetClientRect(p R0, p R2)'
    System::Call 'gdi32::CreateSolidBrush(i $InstallerBgColorref) p.R3'
    System::Call 'user32::FillRect(p R4, p R2, p R3)'
    System::Call 'gdi32::DeleteObject(p R3)'
    System::Call 'kernel32::MulDiv(i 4, i $InstallerDpi, i 96) i.r3'
    IntOp $R5 $R5 + $3
    IntOp $R6 $R6 + $3
    IntOp $R7 $R7 - $3
    IntOp $R8 $R8 - $3
    System::Call 'gdiplus::GdipCreateFromHDC(p R4, *p .R3)'
    System::Call 'gdiplus::GdipSetSmoothingMode(p R3, i 4)'
    ${If} $R0 == $InstallerLanguageRu
        IntOp $0 $R7 - $R5
        IntOp $2 $R8 - $R6
        IntOp $2 $2 / 3
        System::Call 'gdiplus::GdipCreateSolidFill(i 0xFFFFFFFF, *p .r4)'
        System::Call 'gdiplus::GdipFillRectangleI(p R3, p r4, i R5, i R6, i r0, i r2)'
        IntOp $7 $R6 + $2
        System::Call 'gdiplus::GdipDeleteBrush(p r4)'
        System::Call 'gdiplus::GdipCreateSolidFill(i 0xFF0039A6, *p .r4)'
        System::Call 'gdiplus::GdipFillRectangleI(p R3, p r4, i R5, i r7, i r0, i r2)'
        IntOp $7 $7 + $2
        IntOp $8 $R8 - $7
        System::Call 'gdiplus::GdipDeleteBrush(p r4)'
        System::Call 'gdiplus::GdipCreateSolidFill(i 0xFFD52B1E, *p .r4)'
        System::Call 'gdiplus::GdipFillRectangleI(p R3, p r4, i R5, i r7, i r0, i r8)'
        System::Call 'gdiplus::GdipDeleteBrush(p r4)'
    ${EndIf}
    ${If} $R0 == $InstallerLanguageEn
        IntOp $0 $R7 - $R5
        IntOp $1 $R8 - $R6
        System::Call 'gdiplus::GdipCreateSolidFill(i 0xFF012169, *p .r4)'
        System::Call 'gdiplus::GdipFillRectangleI(p R3, p r4, i R5, i R6, i r0, i r1)'
        System::Call 'gdiplus::GdipDeleteBrush(p r4)'
        System::Alloc 32
        Pop $6
        IntOp $2 $1 / 6
        IntOp $7 $R6 + $2
        IntOp $3 $R5 + $2
        IntOp $8 $R8 - $2
        IntOp $5 $R7 - $2
        System::Call 'gdiplus::GdipCreateSolidFill(i 0xFFFFFFFF, *p .r4)'
        System::Call '*$6(i R5, i r7, i r3, i R6, i R7, i r8, i r5, i R8)'
        System::Call 'gdiplus::GdipFillPolygonI(p R3, p r4, p r6, i 4, i 0)'
        System::Call '*$6(i R5, i r8, i r3, i R8, i r5, i R6, i R7, i r7)'
        System::Call 'gdiplus::GdipFillPolygonI(p R3, p r4, p r6, i 4, i 0)'
        System::Call 'gdiplus::GdipDeleteBrush(p r4)'
        IntOp $2 $1 / 10
        IntOp $2 $2 + 1
        IntOp $7 $R6 + $2
        IntOp $3 $R5 + $2
        IntOp $8 $R8 - $2
        IntOp $5 $R7 - $2
        System::Call 'gdiplus::GdipCreateSolidFill(i 0xFFC8102E, *p .r4)'
        System::Call '*$6(i R5, i r7, i r3, i R6, i R7, i r8, i r5, i R8)'
        System::Call 'gdiplus::GdipFillPolygonI(p R3, p r4, p r6, i 4, i 0)'
        System::Call '*$6(i R5, i r8, i r3, i R8, i r5, i R6, i R7, i r7)'
        System::Call 'gdiplus::GdipFillPolygonI(p R3, p r4, p r6, i 4, i 0)'
        System::Call 'gdiplus::GdipDeleteBrush(p r4)'
        IntOp $2 $0 / 5
        IntOp $3 $0 - $2
        IntOp $3 $3 / 2
        IntOp $3 $3 + R5
        IntOp $5 $1 / 3
        IntOp $7 $1 - $5
        IntOp $7 $7 / 2
        IntOp $7 $7 + R6
        System::Call 'gdiplus::GdipCreateSolidFill(i 0xFFFFFFFF, *p .r4)'
        System::Call 'gdiplus::GdipFillRectangleI(p R3, p r4, i r3, i R6, i r2, i r1)'
        System::Call 'gdiplus::GdipFillRectangleI(p R3, p r4, i R5, i r7, i r0, i r5)'
        System::Call 'gdiplus::GdipDeleteBrush(p r4)'
        IntOp $2 $0 / 9
        IntOp $3 $0 - $2
        IntOp $3 $3 / 2
        IntOp $3 $3 + R5
        IntOp $5 $1 / 5
        IntOp $7 $1 - $5
        IntOp $7 $7 / 2
        IntOp $7 $7 + R6
        System::Call 'gdiplus::GdipCreateSolidFill(i 0xFFC8102E, *p .r4)'
        System::Call 'gdiplus::GdipFillRectangleI(p R3, p r4, i r3, i R6, i r2, i r1)'
        System::Call 'gdiplus::GdipFillRectangleI(p R3, p r4, i R5, i r7, i r0, i r5)'
        System::Call 'gdiplus::GdipDeleteBrush(p r4)'
        System::Free $6
    ${EndIf}
    IntOp $0 $R7 - $R5
    IntOp $1 $R8 - $R6
    IntOp $0 $0 - 1
    IntOp $1 $1 - 1
    System::Call 'kernel32::MulDiv(i 4, i $InstallerDpi, i 96) i.r8'
    IntOp $2 $R5 + $0
    IntOp $2 $2 - $8
    IntOp $3 $R6 + $1
    IntOp $3 $3 - $8
    System::Call 'gdiplus::GdipCreatePath(i 0, *p .r4)'
    System::Call 'gdiplus::GdipAddPathArcI(p r4, i R5, i R6, i r8, i r8, i 0x43340000, i 0x42B40000)'
    System::Call 'gdiplus::GdipAddPathArcI(p r4, i r2, i R6, i r8, i r8, i 0x43870000, i 0x42B40000)'
    System::Call 'gdiplus::GdipAddPathArcI(p r4, i r2, i r3, i r8, i r8, i 0, i 0x42B40000)'
    System::Call 'gdiplus::GdipAddPathArcI(p r4, i R5, i r3, i r8, i r8, i 0x42B40000, i 0x42B40000)'
    System::Call 'gdiplus::GdipClosePathFigure(p r4)'
    StrCpy $7 $InstallerBorder
    StrCpy $8 0x3F800000
    IntOp $2 $R9 & 64
    ${If} $2 != 0
        StrCpy $7 $InstallerPrimary
    ${EndIf}
    ${If} $R1 != 0
        StrCpy $7 $InstallerPrimary
        StrCpy $8 0x40000000
    ${EndIf}
    System::Call 'gdiplus::GdipCreatePen1(i r7, i r8, i 2, *p .r5)'
    System::Call 'gdiplus::GdipDrawPath(p R3, p r5, p r4)'
    System::Call 'gdiplus::GdipDeletePen(p r5)'
    System::Call 'gdiplus::GdipDeletePath(p r4)'
    System::Call 'gdiplus::GdipDeleteGraphics(p R3)'
    IntOp $R9 $R9 & 16
    ${If} $R9 != 0
        System::Call 'user32::InflateRect(p R2, i -4, i -4)'
        System::Call 'user32::DrawFocusRect(p R4, p R2)'
    ${EndIf}
    System::Call 'gdi32::RestoreDC(p R4, i -1)'
    System::Free $R2
    ${NSD_Return} 4
FunctionEnd
!endif

Function InstallerMinimize
    Pop $0
    ShowWindow $HWNDPARENT 6
FunctionEnd

Function InstallerClose
    Pop $0
    System::Call 'user32::PostMessageW(p $HWNDPARENT, i ${WM_CLOSE}, p 0, p 0)'
FunctionEnd
!endif
