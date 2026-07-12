# Let Guard Redirect substitute the original Entry target

Guard Redirect는 별도의 후속 탐색을 시작하지 않고 원래 Activity Entry의 대상을 교체한다. push에 대한 Redirect 대상은 push되고, replace에 대한 대상은 replace되며, deep link·default Activity의 Redirect 대상은 초기 Activity가 된다. 원래 대상 Activity는 Stack에 흔적을 남기지 않는다. Redirect가 임의로 push 또는 replace를 선택하게 하는 대신 호출자의 탐색 의도와 예상 Stack 깊이를 보존한다.
