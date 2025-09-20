# Pull Request Checklist

## What & Why
<!-- One paragraph describing what this PR does and why it's needed -->

## Scope Guard
- [ ] ✅ Only files listed in linked issue were modified
- [ ] ✅ No files outside declared scope were touched
- [ ] ✅ Changes align with Session Charter goal

## Size Guard  
- [ ] ✅ ≤200 lines of code diff (else explain below)
- [ ] ✅ ≤2 new files created (else explain below)
- [ ] ✅ No dependency changes (else link to dedicated issue)

## Documentation Updated
- [ ] PROJECT_OVERVIEW.md (if project scope changed)
- [ ] ARCHITECTURE.md (if component structure changed)  
- [ ] DATA_FORMATS.md (if data contracts changed)
- [ ] WORKFLOWS.md (if development process changed)
- [ ] TRANSFORM_PIPELINE.md (if coordinate transforms changed)
- [ ] N/A - no documentation changes needed

## Tests (if applicable)
- [ ] ✅ Tests added for new transform functions
- [ ] ✅ Tests updated for modified transforms  
- [ ] ✅ All existing tests still pass
- [ ] N/A - no testable logic added

## Out of Scope Explicitly Avoided
<!-- List what you intentionally did NOT do to stay focused -->
- 
- 
- 

## Manual Verification
- [ ] ✅ Loaded example container/solution successfully
- [ ] ✅ Mobile view works on http://192.168.4.24:5173/
- [ ] ✅ No console errors in browser
- [ ] ✅ PWA features still functional

## Size Explanation (if >200 LOC)
<!-- Only fill if you exceeded 200 LOC - explain why it was necessary -->

## Linked Issue
Closes #<!-- issue number -->

---
**Reviewer**: Focus on scope adherence first, then code quality. Reject if scope creep detected.
