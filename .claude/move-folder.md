# Folder Move & Import Refactor Guide

## 목적

특정 폴더를 새로운 위치로 이동하고,
해당 폴더를 참조하는 import 경로를 프로젝트 전체에서 수정

---

## 작업 대상

### 이동 전

- src/shared/

### 이동 후

- src/lib/

---

## 작업 내용

1. src/shared/style,
   src/shared/types,
   src/shared/consts.ts,
   src/shared/utils.ts,
   폴더 및 파일을
   src/shared/lib 폴더로 일괄 이동
   이동후 src/lib 위치로 이동

2. 프로젝트 전체에서 이동된 src/lib, src/lib/\* 폴더 및 파일에 해당하는 import를

기존:
import ... from '@shared/...'

변경:
import ... from '@lib/...'

---

## 규칙

1. import 경로만 수정하고 내부 로직은 변경하지 않는다
2. 상대경로가 아닌 alias(@) 기준으로 수정, 변경된 주소가 없으면 새로 생성
3. 사용되지 않는 파일은 삭제한다.

---

## 작업 범위

- src 전체 파일 대상

---

## 주의사항

- 기존 기능 동작 유지 필수
- 잘못된 경로 수정 방지

## 테스트

- build 테스트
