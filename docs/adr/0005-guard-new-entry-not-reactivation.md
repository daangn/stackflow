# Guard new Activity Entry, not Activity Reactivation

Activity Guard는 push·replace와 deep link·default Activity를 통해 요청된 새로운 Activity Entry를 검사한다. Guard Resolution으로 Redirect된 대상도 새로운 Activity Entry이므로 대상 Activity의 Guard를 우회하지 않는다. pop으로 기존 Activity가 다시 드러나는 Activity Reactivation은 검사하지 않으며, 보존된 Stack의 load도 이미 유효한 탐색 맥락의 복원으로 보고 검사하지 않는다. Guard의 책임을 새로운 진입 허가로 한정하여 뒤로가기를 예상치 못한 Redirect로 바꾸거나 기존 Activity의 지속적인 유효성까지 관리하지 않게 한다.
