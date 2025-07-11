; ******************************************************
; Test 02: Window Creation
; Open library, create window, close window, close library
; ******************************************************

        INCLUDE "exec/types.i"
        INCLUDE "intuition/intuition.i"
        INCLUDE "intuition/intuition_lib.i"
        INCLUDE "exec/exec_lib.i"

execbase        EQU     4

; Window constants
WINDOW_WIDTH    EQU     320
WINDOW_HEIGHT   EQU     150
WINDOW_LEFT     EQU     10
WINDOW_TOP      EQU     10

; ******************************************************
; Program start
; ******************************************************

start:
        ; Open intuition library
        lea     intuition_name,a1
        moveq   #0,d0
        move.l  execbase,a6
        jsr     _LVOOpenLibrary(a6)
        tst.l   d0
        beq     exit_fail
        move.l  d0,intuition_base

        ; Open window
        lea     new_window,a0
        move.l  intuition_base,a6
        jsr     _LVOOpenWindow(a6)
        tst.l   d0
        beq     close_library
        move.l  d0,window_pointer

        ; Close window
        move.l  intuition_base,a6
        move.l  window_pointer,a0
        jsr     _LVOCloseWindow(a6)

close_library:
        ; Close intuition library
        move.l  execbase,a6
        move.l  intuition_base,a1
        jsr     _LVOCloseLibrary(a6)

exit_success:
        moveq   #0,d0
        rts

exit_fail:
        moveq   #1,d0
        rts

; ******************************************************
; Window structure
; ******************************************************

new_window:
        dc.w    WINDOW_LEFT             ; LeftEdge
        dc.w    WINDOW_TOP              ; TopEdge
        dc.w    WINDOW_WIDTH            ; Width
        dc.w    WINDOW_HEIGHT           ; Height
        dc.b    1,3                     ; DetailPen, BlockPen
        dc.l    IDCMP_CLOSEWINDOW       ; IDCMPFlags
        dc.l    WFLG_CLOSEGADGET|WFLG_DRAGBAR|WFLG_DEPTHGADGET|WFLG_ACTIVATE ; Flags
        dc.l    0                       ; FirstGadget
        dc.l    0                       ; CheckMark
        dc.l    windowtitle             ; Title
        dc.l    0                       ; Screen (use current)
        dc.l    0                       ; BitMap
        dc.w    WINDOW_WIDTH            ; MinWidth
        dc.w    WINDOW_HEIGHT           ; MinHeight
        dc.w    WINDOW_WIDTH*2          ; MaxWidth
        dc.w    WINDOW_HEIGHT*2         ; MaxHeight
        dc.w    WBENCHSCREEN            ; Type

; ******************************************************
; Data
; ******************************************************

windowtitle:    dc.b    'Test Window',0
                even

intuition_name: dc.b    "intuition.library",0
                even

intuition_base: dc.l    0
window_pointer: dc.l    0

        END 