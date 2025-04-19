com.eclipsesource.json.Json -> com.eclipsesource.json.Json:
    com.eclipsesource.json.JsonValue NULL -> NULL
    com.eclipsesource.json.JsonValue TRUE -> TRUE
    com.eclipsesource.json.JsonValue FALSE -> FALSE
    56:58:void <init>() -> <init>
    83:83:com.eclipsesource.json.JsonValue value(int) -> value
    94:94:com.eclipsesource.json.JsonValue value(long) -> value
    105:108:com.eclipsesource.json.JsonValue value(float) -> value
    119:122:com.eclipsesource.json.JsonValue value(double) -> value
    133:133:com.eclipsesource.json.JsonValue value(java.lang.String) -> value
    144:144:com.eclipsesource.json.JsonValue value(boolean) -> value
    154:154:com.eclipsesource.json.JsonArray array() -> array
    166:173:com.eclipsesource.json.JsonArray array(int[]) -> array
    185:192:com.eclipsesource.json.JsonArray array(long[]) -> array
    204:211:com.eclipsesource.json.JsonArray array(float[]) -> array
    223:230:com.eclipsesource.json.JsonArray array(double[]) -> array
    242:249:com.eclipsesource.json.JsonArray array(boolean[]) -> array
    260:267:com.eclipsesource.json.JsonArray array(java.lang.String[]) -> array
    277:277:com.eclipsesource.json.JsonObject object() -> object
    291:296:com.eclipsesource.json.JsonValue parse(java.lang.String) -> parse
    316:321:com.eclipsesource.json.JsonValue parse(java.io.Reader) -> parse
    325:328:java.lang.String cutOffPointZero(java.lang.String) -> cutOffPointZero
    63:73:void <clinit>() -> <clinit>
com.eclipsesource.json.Json$DefaultHandler -> com.eclipsesource.json.Json$DefaultHandler:
    com.eclipsesource.json.JsonValue value -> value
    331:331:void <init>() -> <init>
    337:337:com.eclipsesource.json.JsonArray startArray() -> startArray
    342:342:com.eclipsesource.json.JsonObject startObject() -> startObject
    347:348:void endNull() -> endNull
    352:353:void endBoolean(boolean) -> endBoolean
    357:358:void endString(java.lang.String) -> endString
    362:363:void endNumber(java.lang.String) -> endNumber
    367:368:void endArray(com.eclipsesource.json.JsonArray) -> endArray
    372:373:void endObject(com.eclipsesource.json.JsonObject) -> endObject
    377:378:void endArrayValue(com.eclipsesource.json.JsonArray) -> endArrayValue
    382:383:void endObjectValue(com.eclipsesource.json.JsonObject,java.lang.String) -> endObjectValue
    386:386:com.eclipsesource.json.JsonValue getValue() -> getValue
    331:331:void endObjectValue(java.lang.Object,java.lang.String) -> endObjectValue
    331:331:void endObject(java.lang.Object) -> endObject
    331:331:java.lang.Object startObject() -> startObject
    331:331:void endArrayValue(java.lang.Object) -> endArrayValue
    331:331:void endArray(java.lang.Object) -> endArray
    331:331:java.lang.Object startArray() -> startArray
com.eclipsesource.json.JsonArray -> com.eclipsesource.json.JsonArray:
    java.util.List values -> values
    70:72:void <init>() -> <init>
    81:82:void <init>(com.eclipsesource.json.JsonArray) -> <init>
    84:93:void <init>(com.eclipsesource.json.JsonArray,boolean) -> <init>
    116:116:com.eclipsesource.json.JsonArray readFrom(java.io.Reader) -> readFrom
    133:133:com.eclipsesource.json.JsonArray readFrom(java.lang.String) -> readFrom
    149:149:com.eclipsesource.json.JsonArray unmodifiableArray(com.eclipsesource.json.JsonArray) -> unmodifiableArray
    161:162:com.eclipsesource.json.JsonArray add(int) -> add
    174:175:com.eclipsesource.json.JsonArray add(long) -> add
    187:188:com.eclipsesource.json.JsonArray add(float) -> add
    200:201:com.eclipsesource.json.JsonArray add(double) -> add
    213:214:com.eclipsesource.json.JsonArray add(boolean) -> add
    225:226:com.eclipsesource.json.JsonArray add(java.lang.String) -> add
    237:241:com.eclipsesource.json.JsonArray add(com.eclipsesource.json.JsonValue) -> add
    258:259:com.eclipsesource.json.JsonArray set(int,int) -> set
    276:277:com.eclipsesource.json.JsonArray set(int,long) -> set
    294:295:com.eclipsesource.json.JsonArray set(int,float) -> set
    312:313:com.eclipsesource.json.JsonArray set(int,double) -> set
    330:331:com.eclipsesource.json.JsonArray set(int,boolean) -> set
    348:349:com.eclipsesource.json.JsonArray set(int,java.lang.String) -> set
    365:369:com.eclipsesource.json.JsonArray set(int,com.eclipsesource.json.JsonValue) -> set
    383:384:com.eclipsesource.json.JsonArray remove(int) -> remove
    393:393:int size() -> size
    402:402:boolean isEmpty() -> isEmpty
    416:416:com.eclipsesource.json.JsonValue get(int) -> get
    427:427:java.util.List values() -> values
    437:438:java.util.Iterator iterator() -> iterator
    456:466:void write(com.eclipsesource.json.JsonWriter) -> write
    470:470:boolean isArray() -> isArray
    475:475:com.eclipsesource.json.JsonArray asArray() -> asArray
    480:480:int hashCode() -> hashCode
    498:508:boolean equals(java.lang.Object) -> equals
com.eclipsesource.json.JsonArray$1 -> com.eclipsesource.json.JsonArray$1:
    java.util.Iterator val$iterator -> val$iterator
    com.eclipsesource.json.JsonArray this$0 -> this$0
    438:438:void <init>(com.eclipsesource.json.JsonArray,java.util.Iterator) -> <init>
    441:441:boolean hasNext() -> hasNext
    445:445:com.eclipsesource.json.JsonValue next() -> next
    449:449:void remove() -> remove
    438:438:java.lang.Object next() -> next
com.eclipsesource.json.JsonHandler -> com.eclipsesource.json.JsonHandler:
    com.eclipsesource.json.JsonParser parser -> parser
    55:55:void <init>() -> <init>
    65:65:com.eclipsesource.json.Location getLocation() -> getLocation
    73:73:void startNull() -> startNull
    80:80:void endNull() -> endNull
    87:87:void startBoolean() -> startBoolean
    97:97:void endBoolean(boolean) -> endBoolean
    104:104:void startString() -> startString
    114:114:void endString(java.lang.String) -> endString
    121:121:void startNumber() -> startNumber
    131:131:void endNumber(java.lang.String) -> endNumber
    146:146:java.lang.Object startArray() -> startArray
    158:158:void endArray(java.lang.Object) -> endArray
    170:170:void startArrayValue(java.lang.Object) -> startArrayValue
    183:183:void endArrayValue(java.lang.Object) -> endArrayValue
    200:200:java.lang.Object startObject() -> startObject
    211:211:void endObject(java.lang.Object) -> endObject
    222:222:void startObjectName(java.lang.Object) -> startObjectName
    234:234:void endObjectName(java.lang.Object,java.lang.String) -> endObjectName
    247:247:void startObjectValue(java.lang.Object,java.lang.String) -> startObjectValue
    261:261:void endObjectValue(java.lang.Object,java.lang.String) -> endObjectValue
com.eclipsesource.json.JsonLiteral -> com.eclipsesource.json.JsonLiteral:
    java.lang.String value -> value
    boolean isNull -> isNull
    boolean isTrue -> isTrue
    boolean isFalse -> isFalse
    35:40:void <init>(java.lang.String) -> <init>
    44:45:void write(com.eclipsesource.json.JsonWriter) -> write
    49:49:java.lang.String toString() -> toString
    54:54:int hashCode() -> hashCode
    59:59:boolean isNull() -> isNull
    64:64:boolean isTrue() -> isTrue
    69:69:boolean isFalse() -> isFalse
    74:74:boolean isBoolean() -> isBoolean
    79:79:boolean asBoolean() -> asBoolean
    84:94:boolean equals(java.lang.Object) -> equals
com.eclipsesource.json.JsonNumber -> com.eclipsesource.json.JsonNumber:
    java.lang.String string -> string
    32:37:void <init>(java.lang.String) -> <init>
    41:41:java.lang.String toString() -> toString
    46:47:void write(com.eclipsesource.json.JsonWriter) -> write
    51:51:boolean isNumber() -> isNumber
    56:56:int asInt() -> asInt
    61:61:long asLong() -> asLong
    66:66:float asFloat() -> asFloat
    71:71:double asDouble() -> asDouble
    76:76:int hashCode() -> hashCode
    81:91:boolean equals(java.lang.Object) -> equals
com.eclipsesource.json.JsonObject -> com.eclipsesource.json.JsonObject:
    java.util.List names -> names
    java.util.List values -> values
    com.eclipsesource.json.JsonObject$HashIndexTable table -> table
    82:86:void <init>() -> <init>
    95:96:void <init>(com.eclipsesource.json.JsonObject) -> <init>
    98:111:void <init>(com.eclipsesource.json.JsonObject,boolean) -> <init>
    134:134:com.eclipsesource.json.JsonObject readFrom(java.io.Reader) -> readFrom
    151:151:com.eclipsesource.json.JsonObject readFrom(java.lang.String) -> readFrom
    168:168:com.eclipsesource.json.JsonObject unmodifiableObject(com.eclipsesource.json.JsonObject) -> unmodifiableObject
    190:191:com.eclipsesource.json.JsonObject add(java.lang.String,int) -> add
    213:214:com.eclipsesource.json.JsonObject add(java.lang.String,long) -> add
    236:237:com.eclipsesource.json.JsonObject add(java.lang.String,float) -> add
    259:260:com.eclipsesource.json.JsonObject add(java.lang.String,double) -> add
    282:283:com.eclipsesource.json.JsonObject add(java.lang.String,boolean) -> add
    305:306:com.eclipsesource.json.JsonObject add(java.lang.String,java.lang.String) -> add
    328:337:com.eclipsesource.json.JsonObject add(java.lang.String,com.eclipsesource.json.JsonValue) -> add
    358:359:com.eclipsesource.json.JsonObject set(java.lang.String,int) -> set
    380:381:com.eclipsesource.json.JsonObject set(java.lang.String,long) -> set
    402:403:com.eclipsesource.json.JsonObject set(java.lang.String,float) -> set
    424:425:com.eclipsesource.json.JsonObject set(java.lang.String,double) -> set
    446:447:com.eclipsesource.json.JsonObject set(java.lang.String,boolean) -> set
    468:469:com.eclipsesource.json.JsonObject set(java.lang.String,java.lang.String) -> set
    489:503:com.eclipsesource.json.JsonObject set(java.lang.String,com.eclipsesource.json.JsonValue) -> set
    516:525:com.eclipsesource.json.JsonObject remove(java.lang.String) -> remove
    538:544:com.eclipsesource.json.JsonObject merge(com.eclipsesource.json.JsonObject) -> merge
    557:561:com.eclipsesource.json.JsonValue get(java.lang.String) -> get
    579:580:int getInt(java.lang.String,int) -> getInt
    598:599:long getLong(java.lang.String,long) -> getLong
    617:618:float getFloat(java.lang.String,float) -> getFloat
    636:637:double getDouble(java.lang.String,double) -> getDouble
    655:656:boolean getBoolean(java.lang.String,boolean) -> getBoolean
    673:674:java.lang.String getString(java.lang.String,java.lang.String) -> getString
    683:683:int size() -> size
    692:692:boolean isEmpty() -> isEmpty
    703:703:java.util.List names() -> names
    713:715:java.util.Iterator iterator() -> iterator
    736:751:void write(com.eclipsesource.json.JsonWriter) -> write
    755:755:boolean isObject() -> isObject
    760:760:com.eclipsesource.json.JsonObject asObject() -> asObject
    765:768:int hashCode() -> hashCode
    773:783:boolean equals(java.lang.Object) -> equals
    787:791:int indexOf(java.lang.String) -> indexOf
    797:800:void readObject(java.io.ObjectInputStream) -> readObject
    803:807:void updateHashIndex() -> updateHashIndex
com.eclipsesource.json.JsonObject$1 -> com.eclipsesource.json.JsonObject$1:
    java.util.Iterator val$namesIterator -> val$namesIterator
    java.util.Iterator val$valuesIterator -> val$valuesIterator
    com.eclipsesource.json.JsonObject this$0 -> this$0
    715:715:void <init>(com.eclipsesource.json.JsonObject,java.util.Iterator,java.util.Iterator) -> <init>
    718:718:boolean hasNext() -> hasNext
    722:724:com.eclipsesource.json.JsonObject$Member next() -> next
    728:728:void remove() -> remove
    715:715:java.lang.Object next() -> next
com.eclipsesource.json.JsonObject$HashIndexTable -> com.eclipsesource.json.JsonObject$HashIndexTable:
    byte[] hashTable -> hashTable
    880:883:void <init>() -> <init>
    880:887:void <init>(com.eclipsesource.json.JsonObject$HashIndexTable) -> <init>
    890:897:void add(java.lang.String,int) -> add
    900:907:void remove(int) -> remove
    910:912:int get(java.lang.Object) -> get
    916:916:int hashSlotFor(java.lang.Object) -> hashSlotFor
com.eclipsesource.json.JsonObject$Member -> com.eclipsesource.json.JsonObject$Member:
    java.lang.String name -> name
    com.eclipsesource.json.JsonValue value -> value
    817:820:void <init>(java.lang.String,com.eclipsesource.json.JsonValue) -> <init>
    828:828:java.lang.String getName() -> getName
    837:837:com.eclipsesource.json.JsonValue getValue() -> getValue
    842:845:int hashCode() -> hashCode
    863:873:boolean equals(java.lang.Object) -> equals
    812:812:java.lang.String access$000(com.eclipsesource.json.JsonObject$Member) -> access$000
    812:812:com.eclipsesource.json.JsonValue access$100(com.eclipsesource.json.JsonObject$Member) -> access$100
com.eclipsesource.json.JsonParser -> com.eclipsesource.json.JsonParser:
    int MAX_NESTING_LEVEL -> MAX_NESTING_LEVEL
    int MIN_BUFFER_SIZE -> MIN_BUFFER_SIZE
    int DEFAULT_BUFFER_SIZE -> DEFAULT_BUFFER_SIZE
    com.eclipsesource.json.JsonHandler handler -> handler
    java.io.Reader reader -> reader
    char[] buffer -> buffer
    int bufferOffset -> bufferOffset
    int index -> index
    int fill -> fill
    int line -> line
    int lineOffset -> lineOffset
    int current -> current
    java.lang.StringBuilder captureBuffer -> captureBuffer
    int captureStart -> captureStart
    int nestingLevel -> nestingLevel
    68:74:void <init>(com.eclipsesource.json.JsonHandler) -> <init>
    86:96:void parse(java.lang.String) -> parse
    114:115:void parse(java.io.Reader) -> parse
    135:157:void parse(java.io.Reader,int) -> parse
    160:195:void readValue() -> readValue
    198:221:void readArray() -> readArray
    224:255:void readObject() -> readObject
    258:261:java.lang.String readName() -> readName
    265:271:void readNull() -> readNull
    274:280:void readTrue() -> readTrue
    283:290:void readFalse() -> readFalse
    293:296:void readRequiredChar(char) -> readRequiredChar
    299:301:void readString() -> readString
    304:319:java.lang.String readStringInternal() -> readStringInternal
    323:360:void readEscape() -> readEscape
    363:377:void readNumber() -> readNumber
    380:388:boolean readFraction() -> readFraction
    392:403:boolean readExponent() -> readExponent
    407:411:boolean readChar(char) -> readChar
    415:419:boolean readDigit() -> readDigit
    423:426:void skipWhiteSpace() -> skipWhiteSpace
    429:448:void read() -> read
    451:455:void startCapture() -> startCapture
    458:461:void pauseCapture() -> pauseCapture
    464:473:java.lang.String endCapture() -> endCapture
    477:479:com.eclipsesource.json.Location getLocation() -> getLocation
    483:486:com.eclipsesource.json.ParseException expected(java.lang.String) -> expected
    490:490:com.eclipsesource.json.ParseException error(java.lang.String) -> error
    494:494:boolean isWhiteSpace() -> isWhiteSpace
    498:498:boolean isDigit() -> isDigit
    502:502:boolean isHexDigit() -> isHexDigit
    508:508:boolean isEndOfText() -> isEndOfText
com.eclipsesource.json.JsonString -> com.eclipsesource.json.JsonString:
    java.lang.String string -> string
    32:37:void <init>(java.lang.String) -> <init>
    41:42:void write(com.eclipsesource.json.JsonWriter) -> write
    46:46:boolean isString() -> isString
    51:51:java.lang.String asString() -> asString
    56:56:int hashCode() -> hashCode
    61:71:boolean equals(java.lang.Object) -> equals
com.eclipsesource.json.JsonValue -> com.eclipsesource.json.JsonValue:
    com.eclipsesource.json.JsonValue TRUE -> TRUE
    com.eclipsesource.json.JsonValue FALSE -> FALSE
    com.eclipsesource.json.JsonValue NULL -> NULL
    87:89:void <init>() -> <init>
    110:110:com.eclipsesource.json.JsonValue readFrom(java.io.Reader) -> readFrom
    125:125:com.eclipsesource.json.JsonValue readFrom(java.lang.String) -> readFrom
    138:138:com.eclipsesource.json.JsonValue valueOf(int) -> valueOf
    151:151:com.eclipsesource.json.JsonValue valueOf(long) -> valueOf
    164:164:com.eclipsesource.json.JsonValue valueOf(float) -> valueOf
    177:177:com.eclipsesource.json.JsonValue valueOf(double) -> valueOf
    190:190:com.eclipsesource.json.JsonValue valueOf(java.lang.String) -> valueOf
    203:203:com.eclipsesource.json.JsonValue valueOf(boolean) -> valueOf
    213:213:boolean isObject() -> isObject
    223:223:boolean isArray() -> isArray
    232:232:boolean isNumber() -> isNumber
    241:241:boolean isString() -> isString
    251:251:boolean isBoolean() -> isBoolean
    260:260:boolean isTrue() -> isTrue
    269:269:boolean isFalse() -> isFalse
    278:278:boolean isNull() -> isNull
    290:290:com.eclipsesource.json.JsonObject asObject() -> asObject
    302:302:com.eclipsesource.json.JsonArray asArray() -> asArray
    321:321:int asInt() -> asInt
    340:340:long asLong() -> asLong
    356:356:float asFloat() -> asFloat
    372:372:double asDouble() -> asDouble
    384:384:java.lang.String asString() -> asString
    396:396:boolean asBoolean() -> asBoolean
    412:413:void writeTo(java.io.Writer) -> writeTo
    429:438:void writeTo(java.io.Writer,com.eclipsesource.json.WriterConfig) -> writeTo
    449:449:java.lang.String toString() -> toString
    460:467:java.lang.String toString(com.eclipsesource.json.WriterConfig) -> toString
    485:485:boolean equals(java.lang.Object) -> equals
    490:490:int hashCode() -> hashCode
    void write(com.eclipsesource.json.JsonWriter) -> write
    71:85:void <clinit>() -> <clinit>
com.eclipsesource.json.JsonWriter -> com.eclipsesource.json.JsonWriter:
    int CONTROL_CHARACTERS_END -> CONTROL_CHARACTERS_END
    char[] QUOT_CHARS -> QUOT_CHARS
    char[] BS_CHARS -> BS_CHARS
    char[] LF_CHARS -> LF_CHARS
    char[] CR_CHARS -> CR_CHARS
    char[] TAB_CHARS -> TAB_CHARS
    char[] UNICODE_2028_CHARS -> UNICODE_2028_CHARS
    char[] UNICODE_2029_CHARS -> UNICODE_2029_CHARS
    char[] HEX_DIGITS -> HEX_DIGITS
    java.io.Writer writer -> writer
    46:48:void <init>(java.io.Writer) -> <init>
    51:52:void writeLiteral(java.lang.String) -> writeLiteral
    55:56:void writeNumber(java.lang.String) -> writeNumber
    59:62:void writeString(java.lang.String) -> writeString
    65:66:void writeArrayOpen() -> writeArrayOpen
    69:70:void writeArrayClose() -> writeArrayClose
    73:74:void writeArraySeparator() -> writeArraySeparator
    77:78:void writeObjectOpen() -> writeObjectOpen
    81:82:void writeObjectClose() -> writeObjectClose
    85:88:void writeMemberName(java.lang.String) -> writeMemberName
    91:92:void writeMemberSeparator() -> writeMemberSeparator
    95:96:void writeObjectSeparator() -> writeObjectSeparator
    99:110:void writeJsonString(java.lang.String) -> writeJsonString
    113:142:char[] getReplacementChars(char) -> getReplacementChars
    32:41:void <clinit>() -> <clinit>
com.eclipsesource.json.Location -> com.eclipsesource.json.Location:
    int offset -> offset
    int line -> line
    int column -> column
    45:49:void <init>(int,int,int) -> <init>
    53:53:java.lang.String toString() -> toString
    58:58:int hashCode() -> hashCode
    63:73:boolean equals(java.lang.Object) -> equals
com.eclipsesource.json.ParseException -> com.eclipsesource.json.ParseException:
    com.eclipsesource.json.Location location -> location
    33:35:void <init>(java.lang.String,com.eclipsesource.json.Location) -> <init>
    43:43:com.eclipsesource.json.Location getLocation() -> getLocation
    55:55:int getOffset() -> getOffset
    66:66:int getLine() -> getLine
    78:78:int getColumn() -> getColumn
com.eclipsesource.json.PrettyPrint -> com.eclipsesource.json.PrettyPrint:
    char[] indentChars -> indentChars
    41:43:void <init>(char[]) -> <init>
    51:51:com.eclipsesource.json.PrettyPrint singleLine() -> singleLine
    62:67:com.eclipsesource.json.PrettyPrint indentWithSpaces(int) -> indentWithSpaces
    76:76:com.eclipsesource.json.PrettyPrint indentWithTabs() -> indentWithTabs
    81:81:com.eclipsesource.json.JsonWriter createWriter(java.io.Writer) -> createWriter
com.eclipsesource.json.PrettyPrint$1 -> com.eclipsesource.json.PrettyPrint$1:
com.eclipsesource.json.PrettyPrint$PrettyPrintWriter -> com.eclipsesource.json.PrettyPrint$PrettyPrintWriter:
    char[] indentChars -> indentChars
    int indent -> indent
    90:92:void <init>(java.io.Writer,char[]) -> <init>
    96:99:void writeArrayOpen() -> writeArrayOpen
    103:106:void writeArrayClose() -> writeArrayClose
    110:114:void writeArraySeparator() -> writeArraySeparator
    118:121:void writeObjectOpen() -> writeObjectOpen
    125:128:void writeObjectClose() -> writeObjectClose
    132:134:void writeMemberSeparator() -> writeMemberSeparator
    138:142:void writeObjectSeparator() -> writeObjectSeparator
    145:152:boolean writeNewLine() -> writeNewLine
    84:84:void <init>(java.io.Writer,char[],com.eclipsesource.json.PrettyPrint$1) -> <init>
com.eclipsesource.json.WriterConfig -> com.eclipsesource.json.WriterConfig:
    com.eclipsesource.json.WriterConfig MINIMAL -> MINIMAL
    com.eclipsesource.json.WriterConfig PRETTY_PRINT -> PRETTY_PRINT
    30:30:void <init>() -> <init>
    com.eclipsesource.json.JsonWriter createWriter(java.io.Writer) -> createWriter
    35:46:void <clinit>() -> <clinit>
com.eclipsesource.json.WriterConfig$1 -> com.eclipsesource.json.WriterConfig$1:
    35:35:void <init>() -> <init>
    38:38:com.eclipsesource.json.JsonWriter createWriter(java.io.Writer) -> createWriter
com.eclipsesource.json.WritingBuffer -> com.eclipsesource.json.WritingBuffer:
    java.io.Writer writer -> writer
    char[] buffer -> buffer
    int fill -> fill
    41:42:void <init>(java.io.Writer) -> <init>
    38:47:void <init>(java.io.Writer,int) -> <init>
    51:55:void write(int) -> write
    59:68:void write(char[],int,int) -> write
    72:81:void write(java.lang.String,int,int) -> write
    88:90:void flush() -> flush
    97:97:void close() -> close
com.mojang.authlib.Agent -> com.mojang.authlib.Agent:
    com.mojang.authlib.Agent MINECRAFT -> MINECRAFT
    com.mojang.authlib.Agent SCROLLS -> SCROLLS
    java.lang.String name -> name
    int version -> version
    10:13:void <init>(java.lang.String,int) -> <init>
    16:16:java.lang.String getName() -> getName
    20:20:int getVersion() -> getVersion
    25:25:java.lang.String toString() -> toString
    4:5:void <clinit>() -> <clinit>
com.mojang.authlib.AuthenticationService -> com.mojang.authlib.AuthenticationService:
    com.mojang.authlib.UserAuthentication createUserAuthentication(com.mojang.authlib.Agent) -> createUserAuthentication
    com.mojang.authlib.minecraft.MinecraftSessionService createMinecraftSessionService() -> createMinecraftSessionService
    com.mojang.authlib.GameProfileRepository createProfileRepository() -> createProfileRepository
com.mojang.authlib.BaseAuthenticationService -> com.mojang.authlib.BaseAuthenticationService:
    3:3:void <init>() -> <init>
com.mojang.authlib.BaseUserAuthentication -> com.mojang.authlib.BaseUserAuthentication:
    org.apache.logging.log4j.Logger LOGGER -> LOGGER
    java.lang.String STORAGE_KEY_PROFILE_NAME -> STORAGE_KEY_PROFILE_NAME
    java.lang.String STORAGE_KEY_PROFILE_ID -> STORAGE_KEY_PROFILE_ID
    java.lang.String STORAGE_KEY_PROFILE_PROPERTIES -> STORAGE_KEY_PROFILE_PROPERTIES
    java.lang.String STORAGE_KEY_USER_NAME -> STORAGE_KEY_USER_NAME
    java.lang.String STORAGE_KEY_USER_ID -> STORAGE_KEY_USER_ID
    java.lang.String STORAGE_KEY_USER_PROPERTIES -> STORAGE_KEY_USER_PROPERTIES
    com.mojang.authlib.AuthenticationService authenticationService -> authenticationService
    com.mojang.authlib.properties.PropertyMap userProperties -> userProperties
    java.lang.String userid -> userid
    java.lang.String username -> username
    java.lang.String password -> password
    com.mojang.authlib.GameProfile selectedProfile -> selectedProfile
    com.mojang.authlib.UserType userType -> userType
    27:37:void <init>(com.mojang.authlib.AuthenticationService) -> <init>
    41:41:boolean canLogIn() -> canLogIn
    46:51:void logOut() -> logOut
    55:55:boolean isLoggedIn() -> isLoggedIn
    60:65:void setUsername(java.lang.String) -> setUsername
    69:74:void setPassword(java.lang.String) -> setPassword
    77:77:java.lang.String getUsername() -> getUsername
    81:81:java.lang.String getPassword() -> getPassword
    87:139:void loadFromStorage(java.util.Map) -> loadFromStorage
    143:185:java.util.Map saveForStorage() -> saveForStorage
    189:190:void setSelectedProfile(com.mojang.authlib.GameProfile) -> setSelectedProfile
    194:194:com.mojang.authlib.GameProfile getSelectedProfile() -> getSelectedProfile
    199:225:java.lang.String toString() -> toString
    229:229:com.mojang.authlib.AuthenticationService getAuthenticationService() -> getAuthenticationService
    234:234:java.lang.String getUserID() -> getUserID
    239:244:com.mojang.authlib.properties.PropertyMap getUserProperties() -> getUserProperties
    249:249:com.mojang.authlib.properties.PropertyMap getModifiableUserProperties() -> getModifiableUserProperties
    254:257:com.mojang.authlib.UserType getUserType() -> getUserType
    262:263:void setUserType(com.mojang.authlib.UserType) -> setUserType
    266:267:void setUserid(java.lang.String) -> setUserid
    17:17:void <clinit>() -> <clinit>
com.mojang.authlib.Environment -> com.mojang.authlib.Environment:
    java.lang.String getAuthHost() -> getAuthHost
    java.lang.String getAccountsHost() -> getAccountsHost
    java.lang.String getSessionHost() -> getSessionHost
    java.lang.String getServicesHost() -> getServicesHost
    java.lang.String getName() -> getName
    java.lang.String asString() -> asString
    21:21:com.mojang.authlib.Environment create(java.lang.String,java.lang.String,java.lang.String,java.lang.String,java.lang.String) -> create
com.mojang.authlib.Environment$1 -> com.mojang.authlib.Environment$1:
    java.lang.String val$auth -> val$auth
    java.lang.String val$account -> val$account
    java.lang.String val$session -> val$session
    java.lang.String val$services -> val$services
    java.lang.String val$name -> val$name
    21:21:void <init>(java.lang.String,java.lang.String,java.lang.String,java.lang.String,java.lang.String) -> <init>
    24:24:java.lang.String getAuthHost() -> getAuthHost
    29:29:java.lang.String getAccountsHost() -> getAccountsHost
    34:34:java.lang.String getSessionHost() -> getSessionHost
    39:39:java.lang.String getServicesHost() -> getServicesHost
    44:44:java.lang.String getName() -> getName
    49:55:java.lang.String asString() -> asString
com.mojang.authlib.EnvironmentParser -> com.mojang.authlib.EnvironmentParser:
    java.lang.String environmentOverride -> environmentOverride
    java.lang.String PROP_PREFIX -> PROP_PREFIX
    org.apache.logging.log4j.Logger LOGGER -> LOGGER
    java.lang.String PROP_ENV -> PROP_ENV
    java.lang.String PROP_AUTH_HOST -> PROP_AUTH_HOST
    java.lang.String PROP_ACCOUNT_HOST -> PROP_ACCOUNT_HOST
    java.lang.String PROP_SESSION_HOST -> PROP_SESSION_HOST
    java.lang.String PROP_SERVICES_HOST -> PROP_SERVICES_HOST
    12:12:void <init>() -> <init>
    17:18:void setEnvironmentOverride(java.lang.String) -> setEnvironmentOverride
    30:32:java.util.Optional getEnvironmentFromProperties() -> getEnvironmentFromProperties
    38:49:java.util.Optional fromHostNames() -> fromHostNames
    21:21:void <clinit>() -> <clinit>
com.mojang.authlib.GameProfile -> com.mojang.authlib.GameProfile:
    java.util.UUID id -> id
    java.lang.String name -> name
    com.mojang.authlib.properties.PropertyMap properties -> properties
    boolean legacy -> legacy
    void <init>(java.util.UUID,java.lang.String) -> <init>
    void <init>(java.lang.String,java.lang.String) -> <init>
    java.util.UUID getId() -> getId
    java.lang.String getId() -> getId
    java.util.UUID getUUID() -> getUUID
    java.lang.String getName() -> getName
    com.mojang.authlib.properties.PropertyMap getProperties() -> getProperties
    boolean isComplete() -> isComplete
    boolean equals(java.lang.Object) -> equals
    int hashCode() -> hashCode
    java.lang.String toString() -> toString
    boolean isLegacy() -> isLegacy
com.mojang.authlib.GameProfileRepository -> com.mojang.authlib.GameProfileRepository:
    void findProfilesByNames(java.lang.String[],com.mojang.authlib.Agent,com.mojang.authlib.ProfileLookupCallback) -> findProfilesByNames
com.mojang.authlib.HttpAuthenticationService -> com.mojang.authlib.HttpAuthenticationService:
    org.apache.logging.log4j.Logger LOGGER -> LOGGER
    java.net.Proxy proxy -> proxy
    26:29:void <init>(java.net.Proxy) -> <init>
    37:37:java.net.Proxy getProxy() -> getProxy
    41:47:java.net.HttpURLConnection createUrlConnection(java.net.URL) -> createUrlConnection
    64:109:java.lang.String performPostRequest(java.net.URL,java.lang.String,java.lang.String) -> performPostRequest
    113:113:java.lang.String performGetRequest(java.net.URL) -> performGetRequest
    129:161:java.lang.String performGetRequest(java.net.URL,java.lang.String) -> performGetRequest
    174:176:java.net.URL constantURL(java.lang.String) -> constantURL
    187:213:java.lang.String buildQuery(java.util.Map) -> buildQuery
    225:231:java.net.URL concatenateURL(java.net.URL,java.lang.String) -> concatenateURL
    22:22:void <clinit>() -> <clinit>
com.mojang.authlib.HttpUserAuthentication -> com.mojang.authlib.HttpUserAuthentication:
    5:6:void <init>(com.mojang.authlib.HttpAuthenticationService) -> <init>
    10:10:com.mojang.authlib.HttpAuthenticationService getAuthenticationService() -> getAuthenticationService
    3:3:com.mojang.authlib.AuthenticationService getAuthenticationService() -> getAuthenticationService
com.mojang.authlib.ProfileLookupCallback -> com.mojang.authlib.ProfileLookupCallback:
    void onProfileLookupSucceeded(com.mojang.authlib.GameProfile) -> onProfileLookupSucceeded
    void onProfileLookupFailed(com.mojang.authlib.GameProfile,java.lang.Exception) -> onProfileLookupFailed
com.mojang.authlib.UserAuthentication -> com.mojang.authlib.UserAuthentication:
    boolean canLogIn() -> canLogIn
    void logIn() -> logIn
    void logOut() -> logOut
    boolean isLoggedIn() -> isLoggedIn
    boolean canPlayOnline() -> canPlayOnline
    com.mojang.authlib.GameProfile[] getAvailableProfiles() -> getAvailableProfiles
    com.mojang.authlib.GameProfile getSelectedProfile() -> getSelectedProfile
    void selectGameProfile(com.mojang.authlib.GameProfile) -> selectGameProfile
    void loadFromStorage(java.util.Map) -> loadFromStorage
    java.util.Map saveForStorage() -> saveForStorage
    void setUsername(java.lang.String) -> setUsername
    void setPassword(java.lang.String) -> setPassword
    java.lang.String getAuthenticatedToken() -> getAuthenticatedToken
    java.lang.String getUserID() -> getUserID
    com.mojang.authlib.properties.PropertyMap getUserProperties() -> getUserProperties
    com.mojang.authlib.UserType getUserType() -> getUserType
com.mojang.authlib.UserType -> com.mojang.authlib.UserType:
    com.mojang.authlib.UserType LEGACY -> LEGACY
    com.mojang.authlib.UserType MOJANG -> MOJANG
    java.util.Map BY_NAME -> BY_NAME
    java.lang.String name -> name
    com.mojang.authlib.UserType[] $VALUES -> $VALUES
    6:6:com.mojang.authlib.UserType[] values() -> values
    6:6:com.mojang.authlib.UserType valueOf(java.lang.String) -> valueOf
    13:15:void <init>(java.lang.String,int,java.lang.String) -> <init>
    18:18:com.mojang.authlib.UserType byName(java.lang.String) -> byName
    22:22:java.lang.String getName() -> getName
    6:29:void <clinit>() -> <clinit>
com.mojang.authlib.exceptions.AuthenticationException -> com.mojang.authlib.exceptions.AuthenticationException:
    4:5:void <init>() -> <init>
    8:9:void <init>(java.lang.String) -> <init>
    12:13:void <init>(java.lang.String,java.lang.Throwable) -> <init>
    16:17:void <init>(java.lang.Throwable) -> <init>
com.mojang.authlib.exceptions.AuthenticationUnavailableException -> com.mojang.authlib.exceptions.AuthenticationUnavailableException:
    4:5:void <init>() -> <init>
    8:9:void <init>(java.lang.String) -> <init>
    12:13:void <init>(java.lang.String,java.lang.Throwable) -> <init>
    16:17:void <init>(java.lang.Throwable) -> <init>
com.mojang.authlib.exceptions.InsufficientPrivilegesException -> com.mojang.authlib.exceptions.InsufficientPrivilegesException:
    4:5:void <init>() -> <init>
    8:9:void <init>(java.lang.String) -> <init>
    12:13:void <init>(java.lang.String,java.lang.Throwable) -> <init>
    16:17:void <init>(java.lang.Throwable) -> <init>
com.mojang.authlib.exceptions.InvalidCredentialsException -> com.mojang.authlib.exceptions.InvalidCredentialsException:
    4:5:void <init>() -> <init>
    8:9:void <init>(java.lang.String) -> <init>
    12:13:void <init>(java.lang.String,java.lang.Throwable) -> <init>
    16:17:void <init>(java.lang.Throwable) -> <init>
com.mojang.authlib.exceptions.MinecraftClientException -> com.mojang.authlib.exceptions.MinecraftClientException:
    com.mojang.authlib.exceptions.MinecraftClientException$ErrorType type -> type
    14:16:void <init>(com.mojang.authlib.exceptions.MinecraftClientException$ErrorType,java.lang.String) -> <init>
    19:21:void <init>(com.mojang.authlib.exceptions.MinecraftClientException$ErrorType,java.lang.String,java.lang.Throwable) -> <init>
    24:24:com.mojang.authlib.exceptions.MinecraftClientException$ErrorType getType() -> getType
    28:28:com.mojang.authlib.exceptions.AuthenticationException toAuthenticationException() -> toAuthenticationException
com.mojang.authlib.exceptions.MinecraftClientException$ErrorType -> com.mojang.authlib.exceptions.MinecraftClientException$ErrorType:
    com.mojang.authlib.exceptions.MinecraftClientException$ErrorType SERVICE_UNAVAILABLE -> SERVICE_UNAVAILABLE
    com.mojang.authlib.exceptions.MinecraftClientException$ErrorType HTTP_ERROR -> HTTP_ERROR
    com.mojang.authlib.exceptions.MinecraftClientException$ErrorType JSON_ERROR -> JSON_ERROR
    com.mojang.authlib.exceptions.MinecraftClientException$ErrorType[] $VALUES -> $VALUES
    5:5:com.mojang.authlib.exceptions.MinecraftClientException$ErrorType[] values() -> values
    5:5:com.mojang.authlib.exceptions.MinecraftClientException$ErrorType valueOf(java.lang.String) -> valueOf
    5:5:void <init>(java.lang.String,int) -> <init>
    5:8:void <clinit>() -> <clinit>
com.mojang.authlib.exceptions.MinecraftClientHttpException -> com.mojang.authlib.exceptions.MinecraftClientHttpException:
    int UNAUTHORIZED -> UNAUTHORIZED
    int FORBIDDEN -> FORBIDDEN
    int status -> status
    com.mojang.authlib.yggdrasil.response.ErrorResponse response -> response
    18:21:void <init>(int) -> <init>
    24:27:void <init>(int,com.mojang.authlib.yggdrasil.response.ErrorResponse) -> <init>
    30:30:int getStatus() -> getStatus
    34:34:java.util.Optional getResponse() -> getResponse
    39:43:java.lang.String toString() -> toString
    51:63:com.mojang.authlib.exceptions.AuthenticationException toAuthenticationException() -> toAuthenticationException
    67:69:java.util.Optional getError() -> getError
    74:85:java.lang.String getErrorMessage(int,com.mojang.authlib.yggdrasil.response.ErrorResponse) -> getErrorMessage
    89:91:boolean hasError(java.lang.String) -> hasError
    90:90:boolean lambda$hasError$0(java.lang.String,java.lang.String) -> lambda$hasError$0
com.mojang.authlib.exceptions.UserMigratedException -> com.mojang.authlib.exceptions.UserMigratedException:
    4:5:void <init>() -> <init>
    8:9:void <init>(java.lang.String) -> <init>
    12:13:void <init>(java.lang.String,java.lang.Throwable) -> <init>
    16:17:void <init>(java.lang.Throwable) -> <init>
com.mojang.authlib.legacy.LegacyAuthenticationService -> com.mojang.authlib.legacy.LegacyAuthenticationService:
    21:22:void <init>(java.net.Proxy) -> <init>
    35:39:com.mojang.authlib.legacy.LegacyUserAuthentication createUserAuthentication(com.mojang.authlib.Agent) -> createUserAuthentication
    44:44:com.mojang.authlib.legacy.LegacyMinecraftSessionService createMinecraftSessionService() -> createMinecraftSessionService
    49:49:com.mojang.authlib.GameProfileRepository createProfileRepository() -> createProfileRepository
    10:10:com.mojang.authlib.minecraft.MinecraftSessionService createMinecraftSessionService() -> createMinecraftSessionService
    10:10:com.mojang.authlib.UserAuthentication createUserAuthentication(com.mojang.authlib.Agent) -> createUserAuthentication
com.mojang.authlib.legacy.LegacyMinecraftSessionService -> com.mojang.authlib.legacy.LegacyMinecraftSessionService:
    java.lang.String BASE_URL -> BASE_URL
    java.net.URL JOIN_URL -> JOIN_URL
    java.net.URL CHECK_URL -> CHECK_URL
    26:27:void <init>(com.mojang.authlib.legacy.LegacyAuthenticationService) -> <init>
    31:48:void joinServer(com.mojang.authlib.GameProfile,java.lang.String,java.lang.String) -> joinServer
    52:64:com.mojang.authlib.GameProfile hasJoinedServer(com.mojang.authlib.GameProfile,java.lang.String,java.net.InetAddress) -> hasJoinedServer
    70:70:java.util.Map getTextures(com.mojang.authlib.GameProfile,boolean) -> getTextures
    75:75:com.mojang.authlib.GameProfile fillProfileProperties(com.mojang.authlib.GameProfile,boolean) -> fillProfileProperties
    80:80:com.mojang.authlib.legacy.LegacyAuthenticationService getAuthenticationService() -> getAuthenticationService
    19:19:com.mojang.authlib.HttpAuthenticationService getAuthenticationService() -> getAuthenticationService
    19:19:com.mojang.authlib.AuthenticationService getAuthenticationService() -> getAuthenticationService
    22:23:void <clinit>() -> <clinit>
com.mojang.authlib.legacy.LegacyUserAuthentication -> com.mojang.authlib.legacy.LegacyUserAuthentication:
    java.net.URL AUTHENTICATION_URL -> AUTHENTICATION_URL
    int AUTHENTICATION_VERSION -> AUTHENTICATION_VERSION
    int RESPONSE_PART_PROFILE_NAME -> RESPONSE_PART_PROFILE_NAME
    int RESPONSE_PART_SESSION_TOKEN -> RESPONSE_PART_SESSION_TOKEN
    int RESPONSE_PART_PROFILE_ID -> RESPONSE_PART_PROFILE_ID
    java.lang.String sessionToken -> sessionToken
    31:32:void <init>(com.mojang.authlib.legacy.LegacyAuthenticationService) -> <init>
    36:72:void logIn() -> logIn
    76:78:void logOut() -> logOut
    82:82:boolean canPlayOnline() -> canPlayOnline
    87:90:com.mojang.authlib.GameProfile[] getAvailableProfiles() -> getAvailableProfiles
    101:101:void selectGameProfile(com.mojang.authlib.GameProfile) -> selectGameProfile
    106:106:java.lang.String getAuthenticatedToken() -> getAuthenticatedToken
    111:111:java.lang.String getUserID() -> getUserID
    116:116:com.mojang.authlib.legacy.LegacyAuthenticationService getAuthenticationService() -> getAuthenticationService
    17:17:com.mojang.authlib.HttpAuthenticationService getAuthenticationService() -> getAuthenticationService
    17:17:com.mojang.authlib.AuthenticationService getAuthenticationService() -> getAuthenticationService
    19:19:void <clinit>() -> <clinit>
com.mojang.authlib.minecraft.BaseMinecraftSessionService -> com.mojang.authlib.minecraft.BaseMinecraftSessionService:
    com.mojang.authlib.AuthenticationService authenticationService -> authenticationService
    8:10:void <init>(com.mojang.authlib.AuthenticationService) -> <init>
    13:13:com.mojang.authlib.AuthenticationService getAuthenticationService() -> getAuthenticationService
com.mojang.authlib.minecraft.HttpMinecraftSessionService -> com.mojang.authlib.minecraft.HttpMinecraftSessionService:
    7:8:void <init>(com.mojang.authlib.HttpAuthenticationService) -> <init>
    12:12:com.mojang.authlib.HttpAuthenticationService getAuthenticationService() -> getAuthenticationService
    5:5:com.mojang.authlib.AuthenticationService getAuthenticationService() -> getAuthenticationService
com.mojang.authlib.minecraft.InsecureTextureException -> com.mojang.authlib.minecraft.InsecureTextureException:
    11:12:void <init>(java.lang.String) -> <init>
com.mojang.authlib.minecraft.InsecureTextureException$MissingTextureException -> com.mojang.authlib.minecraft.InsecureTextureException$MissingTextureException:
    40:41:void <init>() -> <init>
com.mojang.authlib.minecraft.InsecureTextureException$OutdatedTextureException -> com.mojang.authlib.minecraft.InsecureTextureException$OutdatedTextureException:
    java.util.Date validFrom -> validFrom
    java.util.Calendar limit -> limit
    19:22:void <init>(java.util.Date,java.util.Calendar) -> <init>
com.mojang.authlib.minecraft.InsecureTextureException$WrongTextureOwnerException -> com.mojang.authlib.minecraft.InsecureTextureException$WrongTextureOwnerException:
    com.mojang.authlib.GameProfile expected -> expected
    java.util.UUID resultId -> resultId
    java.lang.String resultName -> resultName
    31:35:void <init>(com.mojang.authlib.GameProfile,java.util.UUID,java.lang.String) -> <init>
com.mojang.authlib.minecraft.MinecraftProfileTexture -> com.mojang.authlib.minecraft.MinecraftProfileTexture:
    java.util.Set PROFILE_TEXTURE_TYPES -> PROFILE_TEXTURE_TYPES
    int PROFILE_TEXTURE_COUNT -> PROFILE_TEXTURE_COUNT
    java.lang.String url -> url
    java.lang.String hash -> hash
    15:16:void <init>(java.lang.String) -> <init>
    18:21:void <init>(java.lang.String,java.lang.String) -> <init>
    24:32:java.lang.String baseName(java.lang.String) -> baseName
    36:36:java.lang.String getHash() -> getHash
    40:40:java.lang.String getMetadata(java.lang.String) -> getMetadata
    44:44:java.lang.String getUrl() -> getUrl
    49:49:java.lang.String toString() -> toString
    8:9:void <clinit>() -> <clinit>
com.mojang.authlib.minecraft.MinecraftProfileTexture$Type -> com.mojang.authlib.minecraft.MinecraftProfileTexture$Type:
    com.mojang.authlib.minecraft.MinecraftProfileTexture$Type SKIN -> SKIN
    com.mojang.authlib.minecraft.MinecraftProfileTexture$Type CAPE -> CAPE
    com.mojang.authlib.minecraft.MinecraftProfileTexture$Type ELYTRA -> ELYTRA
    com.mojang.authlib.minecraft.MinecraftProfileTexture$Type[] $VALUES -> $VALUES
    52:52:com.mojang.authlib.minecraft.MinecraftProfileTexture$Type[] values() -> values
    52:52:com.mojang.authlib.minecraft.MinecraftProfileTexture$Type valueOf(java.lang.String) -> valueOf
    52:52:void <init>(java.lang.String,int) -> <init>
    52:55:void <clinit>() -> <clinit>
com.mojang.authlib.minecraft.MinecraftSessionService -> com.mojang.authlib.minecraft.MinecraftSessionService:
    void joinServer(com.mojang.authlib.GameProfile,java.lang.String,java.lang.String) -> joinServer
    com.mojang.authlib.GameProfile hasJoinedServer(com.mojang.authlib.GameProfile,java.lang.String) -> hasJoinedServer
    com.mojang.authlib.GameProfile hasJoinedServer(com.mojang.authlib.GameProfile,java.lang.String,java.net.InetAddress) -> hasJoinedServer
    java.util.Map getTextures(com.mojang.authlib.GameProfile,boolean) -> getTextures
    com.mojang.authlib.GameProfile fillProfileProperties(com.mojang.authlib.GameProfile,boolean) -> fillProfileProperties
com.mojang.authlib.minecraft.OfflineSocialInteractions -> com.mojang.authlib.minecraft.OfflineSocialInteractions:
    5:5:void <init>() -> <init>
    8:8:boolean serversAllowed() -> serversAllowed
    13:13:boolean realmsAllowed() -> realmsAllowed
    18:18:boolean chatAllowed() -> chatAllowed
    23:23:boolean isBlockedPlayer(java.util.UUID) -> isBlockedPlayer
com.mojang.authlib.minecraft.SocialInteractionsService -> com.mojang.authlib.minecraft.SocialInteractionsService:
    boolean serversAllowed() -> serversAllowed
    boolean realmsAllowed() -> realmsAllowed
    boolean chatAllowed() -> chatAllowed
    boolean isBlockedPlayer(java.util.UUID) -> isBlockedPlayer
com.mojang.authlib.minecraft.TelemetryEvent -> com.mojang.authlib.minecraft.TelemetryEvent:
    com.mojang.authlib.minecraft.TelemetryEvent EMPTY -> EMPTY
    void send() -> send
    4:4:void <clinit>() -> <clinit>
com.mojang.authlib.minecraft.TelemetryEvent$1 -> com.mojang.authlib.minecraft.TelemetryEvent$1:
    4:4:void <init>() -> <init>
    7:7:void addProperty(java.lang.String,java.lang.String) -> addProperty
    11:11:void addProperty(java.lang.String,int) -> addProperty
    15:15:void addProperty(java.lang.String,boolean) -> addProperty
    19:19:void addNullProperty(java.lang.String) -> addNullProperty
    23:23:void send() -> send
com.mojang.authlib.minecraft.TelemetryPropertyContainer -> com.mojang.authlib.minecraft.TelemetryPropertyContainer:
    void addProperty(java.lang.String,java.lang.String) -> addProperty
    void addProperty(java.lang.String,int) -> addProperty
    void addProperty(java.lang.String,boolean) -> addProperty
    void addNullProperty(java.lang.String) -> addNullProperty
    16:16:com.mojang.authlib.minecraft.TelemetryPropertyContainer forJsonObject(com.google.gson.JsonObject) -> forJsonObject
com.mojang.authlib.minecraft.TelemetryPropertyContainer$1 -> com.mojang.authlib.minecraft.TelemetryPropertyContainer$1:
    com.google.gson.JsonObject val$object -> val$object
    16:16:void <init>(com.google.gson.JsonObject) -> <init>
    19:20:void addProperty(java.lang.String,java.lang.String) -> addProperty
    24:25:void addProperty(java.lang.String,int) -> addProperty
    29:30:void addProperty(java.lang.String,boolean) -> addProperty
    34:35:void addNullProperty(java.lang.String) -> addNullProperty
com.mojang.authlib.minecraft.TelemetrySession -> com.mojang.authlib.minecraft.TelemetrySession:
    com.mojang.authlib.minecraft.TelemetrySession DISABLED -> DISABLED
    boolean isEnabled() -> isEnabled
    com.mojang.authlib.minecraft.TelemetryPropertyContainer globalProperties() -> globalProperties
    void eventSetupFunction(java.util.function.Consumer) -> eventSetupFunction
    com.mojang.authlib.minecraft.TelemetryEvent createNewEvent(java.lang.String) -> createNewEvent
    6:6:void <clinit>() -> <clinit>
com.mojang.authlib.minecraft.TelemetrySession$1 -> com.mojang.authlib.minecraft.TelemetrySession$1:
    6:6:void <init>() -> <init>
    9:9:boolean isEnabled() -> isEnabled
    14:14:com.mojang.authlib.minecraft.TelemetryPropertyContainer globalProperties() -> globalProperties
    19:19:void eventSetupFunction(java.util.function.Consumer) -> eventSetupFunction
    23:23:com.mojang.authlib.minecraft.TelemetryEvent createNewEvent(java.lang.String) -> createNewEvent
com.mojang.authlib.minecraft.UserApiService -> com.mojang.authlib.minecraft.UserApiService:
    com.mojang.authlib.minecraft.UserApiService$UserProperties OFFLINE_PROPERTIES -> OFFLINE_PROPERTIES
    com.mojang.authlib.minecraft.UserApiService OFFLINE -> OFFLINE
    com.mojang.authlib.minecraft.UserApiService$UserProperties properties() -> properties
    boolean isBlockedPlayer(java.util.UUID) -> isBlockedPlayer
    void refreshBlockList() -> refreshBlockList
    com.mojang.authlib.minecraft.TelemetrySession newTelemetrySession(java.util.concurrent.Executor) -> newTelemetrySession
    54:58:void <clinit>() -> <clinit>
com.mojang.authlib.minecraft.UserApiService$1 -> com.mojang.authlib.minecraft.UserApiService$1:
    58:58:void <init>() -> <init>
    61:61:com.mojang.authlib.minecraft.UserApiService$UserProperties properties() -> properties
    66:66:boolean isBlockedPlayer(java.util.UUID) -> isBlockedPlayer
    71:71:void refreshBlockList() -> refreshBlockList
    75:75:com.mojang.authlib.minecraft.TelemetrySession newTelemetrySession(java.util.concurrent.Executor) -> newTelemetrySession
com.mojang.authlib.minecraft.UserApiService$UserFlag -> com.mojang.authlib.minecraft.UserApiService$UserFlag:
    com.mojang.authlib.minecraft.UserApiService$UserFlag SERVERS_ALLOWED -> SERVERS_ALLOWED
    com.mojang.authlib.minecraft.UserApiService$UserFlag REALMS_ALLOWED -> REALMS_ALLOWED
    com.mojang.authlib.minecraft.UserApiService$UserFlag CHAT_ALLOWED -> CHAT_ALLOWED
    com.mojang.authlib.minecraft.UserApiService$UserFlag TELEMETRY_ENABLED -> TELEMETRY_ENABLED
    com.mojang.authlib.minecraft.UserApiService$UserFlag PROFANITY_FILTER_ENABLED -> PROFANITY_FILTER_ENABLED
    com.mojang.authlib.minecraft.UserApiService$UserFlag[] $VALUES -> $VALUES
    10:10:com.mojang.authlib.minecraft.UserApiService$UserFlag[] values() -> values
    10:10:com.mojang.authlib.minecraft.UserApiService$UserFlag valueOf(java.lang.String) -> valueOf
    10:10:void <init>(java.lang.String,int) -> <init>
    10:30:void <clinit>() -> <clinit>
com.mojang.authlib.minecraft.UserApiService$UserProperties -> com.mojang.authlib.minecraft.UserApiService$UserProperties:
    java.util.Set flags -> flags
    37:39:void <init>(java.util.Set) -> <init>
    42:42:java.util.Set getFlags() -> getFlags
    46:47:void setFlags(java.util.Set) -> setFlags
    50:50:boolean flag(com.mojang.authlib.minecraft.UserApiService$UserFlag) -> flag
com.mojang.authlib.minecraft.client.MinecraftClient -> com.mojang.authlib.minecraft.client.MinecraftClient:
    org.apache.logging.log4j.Logger LOGGER -> LOGGER
    int CONNECT_TIMEOUT_MS -> CONNECT_TIMEOUT_MS
    int READ_TIMEOUT_MS -> READ_TIMEOUT_MS
    java.lang.String accessToken -> accessToken
    java.net.Proxy proxy -> proxy
    com.mojang.authlib.minecraft.client.ObjectMapper objectMapper -> objectMapper
    35:40:void <init>(java.lang.String,java.net.Proxy) -> <init>
    43:48:java.lang.Object get(java.net.URL,java.lang.Class) -> get
    52:58:java.lang.Object post(java.net.URL,java.lang.Object,java.lang.Class) -> post
    63:89:java.lang.Object readInputStream(java.net.URL,java.lang.Class,java.net.HttpURLConnection) -> readInputStream
    94:109:java.net.HttpURLConnection postInternal(java.net.URL,byte[]) -> postInternal
    115:122:java.net.HttpURLConnection createUrlConnection(java.net.URL) -> createUrlConnection
    29:29:void <clinit>() -> <clinit>
com.mojang.authlib.minecraft.client.ObjectMapper -> com.mojang.authlib.minecraft.client.ObjectMapper:
    com.google.gson.Gson gson -> gson
    16:18:void <init>(com.google.gson.Gson) -> <init>
    22:24:java.lang.Object readValue(java.lang.String,java.lang.Class) -> readValue
    30:32:java.lang.String writeValueAsString(java.lang.Object) -> writeValueAsString
    37:37:com.mojang.authlib.minecraft.client.ObjectMapper create() -> create
com.mojang.authlib.properties.Property -> com.mojang.authlib.properties.Property:
    java.lang.String name -> name
    java.lang.String value -> value
    java.lang.String signature -> signature
    17:18:void <init>(java.lang.String,java.lang.String) -> <init>
    20:24:void <init>(java.lang.String,java.lang.String,java.lang.String) -> <init>
    27:27:java.lang.String getName() -> getName
    31:31:java.lang.String getValue() -> getValue
    35:35:java.lang.String getSignature() -> getSignature
    39:39:boolean hasSignature() -> hasSignature
    44:55:boolean isSignatureValid(java.security.PublicKey) -> isSignatureValid
com.mojang.authlib.properties.PropertyMap -> com.mojang.authlib.properties.PropertyMap:
    com.google.common.collect.Multimap properties -> properties
    18:19:void <init>() -> <init>
    23:23:com.google.common.collect.Multimap delegate() -> delegate
    18:18:java.lang.Object delegate() -> delegate
com.mojang.authlib.properties.PropertyMap$Serializer -> com.mojang.authlib.properties.PropertyMap$Serializer:
    26:26:void <init>() -> <init>
    29:57:com.mojang.authlib.properties.PropertyMap deserialize(com.google.gson.JsonElement,java.lang.reflect.Type,com.google.gson.JsonDeserializationContext) -> deserialize
    62:77:com.google.gson.JsonElement serialize(com.mojang.authlib.properties.PropertyMap,java.lang.reflect.Type,com.google.gson.JsonSerializationContext) -> serialize
    26:26:com.google.gson.JsonElement serialize(java.lang.Object,java.lang.reflect.Type,com.google.gson.JsonSerializationContext) -> serialize
    26:26:java.lang.Object deserialize(com.google.gson.JsonElement,java.lang.reflect.Type,com.google.gson.JsonDeserializationContext) -> deserialize
com.mojang.authlib.yggdrasil.CompatBridge -> com.mojang.authlib.yggdrasil.CompatBridge:
    int PROFILES_MAX_BATCH_SIZE -> PROFILES_MAX_BATCH_SIZE
    20:20:void <init>() -> <init>
    24:25:com.mojang.authlib.yggdrasil.CompatProfile checkServer(java.lang.String,java.lang.String) -> checkServer
    29:35:boolean joinServer(java.lang.String,java.lang.String,java.lang.String) -> joinServer
    40:40:com.mojang.authlib.yggdrasil.CompatProfile profileByUUID(java.util.UUID) -> profileByUUID
    45:45:com.mojang.authlib.yggdrasil.CompatProfile profileByUsername(java.lang.String) -> profileByUsername
    50:59:com.mojang.authlib.yggdrasil.CompatProfile[] profilesByUsername(java.lang.String[]) -> profilesByUsername
com.mojang.authlib.yggdrasil.CompatProfile -> com.mojang.authlib.yggdrasil.CompatProfile:
    java.lang.String SKIN_URL_PROPERTY -> SKIN_URL_PROPERTY
    java.lang.String SKIN_DIGEST_PROPERTY -> SKIN_DIGEST_PROPERTY
    java.lang.String CLOAK_URL_PROPERTY -> CLOAK_URL_PROPERTY
    java.lang.String CLOAK_DIGEST_PROPERTY -> CLOAK_DIGEST_PROPERTY
    java.util.UUID uuid -> uuid
    java.lang.String uuidHash -> uuidHash
    java.lang.String username -> username
    java.lang.String skinURL -> skinURL
    java.lang.String skinDigest -> skinDigest
    java.lang.String cloakURL -> cloakURL
    java.lang.String cloakDigest -> cloakDigest
    23:31:void <init>(java.util.UUID,java.lang.String,java.lang.String,java.lang.String,java.lang.String,java.lang.String) -> <init>
    34:38:com.mojang.authlib.yggdrasil.CompatProfile fromPlayerProfile(launcher.client.PlayerProfile) -> fromPlayerProfile
    43:56:int countProperties() -> countProperties
com.mojang.authlib.yggdrasil.LegacyBridge -> com.mojang.authlib.yggdrasil.LegacyBridge:
    14:14:void <init>() -> <init>
    18:19:boolean checkServer(java.lang.String,java.lang.String) -> checkServer
    24:26:java.lang.String getCloakURL(java.lang.String) -> getCloakURL
    31:33:java.lang.String getSkinURL(java.lang.String) -> getSkinURL
    38:48:java.lang.String joinServer(java.lang.String,java.lang.String,java.lang.String) -> joinServer
com.mojang.authlib.yggdrasil.ProfileIncompleteException -> com.mojang.authlib.yggdrasil.ProfileIncompleteException:
    4:5:void <init>() -> <init>
    8:9:void <init>(java.lang.String) -> <init>
    12:13:void <init>(java.lang.String,java.lang.Throwable) -> <init>
    16:17:void <init>(java.lang.Throwable) -> <init>
com.mojang.authlib.yggdrasil.ProfileNotFoundException -> com.mojang.authlib.yggdrasil.ProfileNotFoundException:
    4:5:void <init>() -> <init>
    8:9:void <init>(java.lang.String) -> <init>
    12:13:void <init>(java.lang.String,java.lang.Throwable) -> <init>
    16:17:void <init>(java.lang.Throwable) -> <init>
com.mojang.authlib.yggdrasil.YggdrasilAuthenticationService -> com.mojang.authlib.yggdrasil.YggdrasilAuthenticationService:
    com.mojang.authlib.Environment environment -> environment
    java.net.Proxy proxy -> proxy
    17:18:void <init>(java.net.Proxy) -> <init>
    21:22:void <init>(java.net.Proxy,com.mojang.authlib.Environment) -> <init>
    25:26:void <init>(java.net.Proxy,java.lang.String) -> <init>
    28:32:void <init>(java.net.Proxy,java.lang.String,com.mojang.authlib.Environment) -> <init>
    35:35:com.mojang.authlib.Environment determineEnvironment() -> determineEnvironment
    39:39:com.mojang.authlib.UserAuthentication createUserAuthentication(com.mojang.authlib.Agent) -> createUserAuthentication
    43:43:com.mojang.authlib.minecraft.MinecraftSessionService createMinecraftSessionService() -> createMinecraftSessionService
    47:47:com.mojang.authlib.GameProfileRepository createProfileRepository() -> createProfileRepository
    51:51:com.mojang.authlib.yggdrasil.YggdrasilSocialInteractionsService createSocialInteractionsService(java.lang.String) -> createSocialInteractionsService
    55:55:com.mojang.authlib.minecraft.UserApiService createUserApiService(java.lang.String) -> createUserApiService
com.mojang.authlib.yggdrasil.YggdrasilAuthenticationService$1 -> com.mojang.authlib.yggdrasil.YggdrasilAuthenticationService$1:
com.mojang.authlib.yggdrasil.YggdrasilAuthenticationService$GameProfileSerializer -> com.mojang.authlib.yggdrasil.YggdrasilAuthenticationService$GameProfileSerializer:
    130:130:void <init>() -> <init>
    133:136:com.mojang.authlib.GameProfile deserialize(com.google.gson.JsonElement,java.lang.reflect.Type,com.google.gson.JsonDeserializationContext) -> deserialize
    141:148:com.google.gson.JsonElement serialize(com.mojang.authlib.GameProfile,java.lang.reflect.Type,com.google.gson.JsonSerializationContext) -> serialize
    130:130:com.google.gson.JsonElement serialize(java.lang.Object,java.lang.reflect.Type,com.google.gson.JsonSerializationContext) -> serialize
    130:130:java.lang.Object deserialize(com.google.gson.JsonElement,java.lang.reflect.Type,com.google.gson.JsonDeserializationContext) -> deserialize
    130:130:void <init>(com.mojang.authlib.yggdrasil.YggdrasilAuthenticationService$1) -> <init>
com.mojang.authlib.yggdrasil.YggdrasilEnvironment -> com.mojang.authlib.yggdrasil.YggdrasilEnvironment:
    com.mojang.authlib.yggdrasil.YggdrasilEnvironment PROD -> PROD
    com.mojang.authlib.yggdrasil.YggdrasilEnvironment STAGING -> STAGING
    com.mojang.authlib.Environment environment -> environment
    com.mojang.authlib.yggdrasil.YggdrasilEnvironment[] $VALUES -> $VALUES
    9:9:com.mojang.authlib.yggdrasil.YggdrasilEnvironment[] values() -> values
    9:9:com.mojang.authlib.yggdrasil.YggdrasilEnvironment valueOf(java.lang.String) -> valueOf
    25:27:void <init>(java.lang.String,int,java.lang.String,java.lang.String,java.lang.String,java.lang.String) -> <init>
    30:30:com.mojang.authlib.Environment getEnvironment() -> getEnvironment
    34:38:java.util.Optional fromString(java.lang.String) -> fromString
    36:36:boolean lambda$fromString$0(java.lang.String,com.mojang.authlib.yggdrasil.YggdrasilEnvironment) -> lambda$fromString$0
    9:16:void <clinit>() -> <clinit>
com.mojang.authlib.yggdrasil.YggdrasilGameProfileRepository -> com.mojang.authlib.yggdrasil.YggdrasilGameProfileRepository:
    long BUSY_WAIT_MS -> BUSY_WAIT_MS
    long ERROR_BUSY_WAIT_MS -> ERROR_BUSY_WAIT_MS
    24:26:void <init>(com.mojang.authlib.yggdrasil.YggdrasilAuthenticationService,com.mojang.authlib.Environment) -> <init>
    30:34:void busyWait(long) -> busyWait
    38:77:void findProfilesByNames(java.lang.String[],com.mojang.authlib.Agent,com.mojang.authlib.ProfileLookupCallback) -> findProfilesByNames
    17:21:void <clinit>() -> <clinit>
com.mojang.authlib.yggdrasil.YggdrasilMinecraftSessionService -> com.mojang.authlib.yggdrasil.YggdrasilMinecraftSessionService:
    com.google.gson.JsonParser JSON_PARSER -> JSON_PARSER
    boolean NO_TEXTURES -> NO_TEXTURES
    37:39:void <init>(com.mojang.authlib.AuthenticationService) -> <init>
    42:44:void <init>(com.mojang.authlib.yggdrasil.YggdrasilAuthenticationService) -> <init>
    47:49:void <init>(com.mojang.authlib.yggdrasil.YggdrasilAuthenticationService,com.mojang.authlib.Environment) -> <init>
    52:54:void <init>(com.mojang.authlib.AuthenticationService,com.mojang.authlib.Environment) -> <init>
    57:74:void fillTextureProperties(com.mojang.authlib.GameProfile,launcher.client.PlayerProfile) -> fillTextureProperties
    77:79:com.mojang.authlib.GameProfile toGameProfile(launcher.client.PlayerProfile) -> toGameProfile
    86:110:void getTexturesMojang(java.util.Map,java.lang.String,com.mojang.authlib.GameProfile) -> getTexturesMojang
    115:140:com.mojang.authlib.GameProfile fillProfileProperties(com.mojang.authlib.GameProfile,boolean) -> fillProfileProperties
    145:174:java.util.Map getTextures(com.mojang.authlib.GameProfile,boolean) -> getTextures
    179:193:com.mojang.authlib.GameProfile hasJoinedServer(com.mojang.authlib.GameProfile,java.lang.String) -> hasJoinedServer
    198:198:com.mojang.authlib.GameProfile hasJoinedServer(com.mojang.authlib.GameProfile,java.lang.String,java.net.InetAddress) -> hasJoinedServer
    203:224:void joinServer(com.mojang.authlib.GameProfile,java.lang.String,java.lang.String) -> joinServer
    33:34:void <clinit>() -> <clinit>
com.mojang.authlib.yggdrasil.YggdrasilSocialInteractionsService -> com.mojang.authlib.yggdrasil.YggdrasilSocialInteractionsService:
    9:10:void <init>(com.mojang.authlib.yggdrasil.YggdrasilAuthenticationService,java.lang.String,com.mojang.authlib.Environment) -> <init>
    13:13:boolean serversAllowed() -> serversAllowed
    17:17:boolean realmsAllowed() -> realmsAllowed
    21:21:boolean chatAllowed() -> chatAllowed
    25:25:boolean isBlockedPlayer(java.util.UUID) -> isBlockedPlayer
com.mojang.authlib.yggdrasil.YggdrasilUserApiService -> com.mojang.authlib.yggdrasil.YggdrasilUserApiService:
    long BLOCKLIST_REQUEST_COOLDOWN_SECONDS -> BLOCKLIST_REQUEST_COOLDOWN_SECONDS
    java.util.UUID ZERO_UUID -> ZERO_UUID
    com.mojang.authlib.minecraft.UserApiService$UserProperties properties -> properties
    java.time.Instant nextAcceptableBlockRequest -> nextAcceptableBlockRequest
    java.util.Set blockList -> blockList
    20:30:void <init>(java.lang.String,java.net.Proxy,com.mojang.authlib.Environment) -> <init>
    34:34:com.mojang.authlib.minecraft.UserApiService$UserProperties properties() -> properties
    39:39:com.mojang.authlib.minecraft.TelemetrySession newTelemetrySession(java.util.concurrent.Executor) -> newTelemetrySession
    44:44:boolean isBlockedPlayer(java.util.UUID) -> isBlockedPlayer
    48:48:void refreshBlockList() -> refreshBlockList
    52:52:java.util.Set fetchBlockList() -> fetchBlockList
    56:56:boolean canMakeBlockListRequest() -> canMakeBlockListRequest
    61:61:java.util.Set forceFetchBlockList() -> forceFetchBlockList
    66:66:void fetchProperties() -> fetchProperties
    69:72:void addFlagIfUserHasPrivilege(boolean,com.mojang.authlib.minecraft.UserApiService$UserFlag,com.google.common.collect.ImmutableSet$Builder) -> addFlagIfUserHasPrivilege
    18:18:void <clinit>() -> <clinit>
com.mojang.authlib.yggdrasil.YggdrasilUserAuthentication -> com.mojang.authlib.yggdrasil.YggdrasilUserAuthentication:
    org.apache.logging.log4j.Logger LOGGER -> LOGGER
    java.net.URL routeAuthenticate -> routeAuthenticate
    java.net.URL routeRefresh -> routeRefresh
    java.net.URL routeValidate -> routeValidate
    java.net.URL routeInvalidate -> routeInvalidate
    java.net.URL routeSignout -> routeSignout
    java.lang.String STORAGE_KEY_ACCESS_TOKEN -> STORAGE_KEY_ACCESS_TOKEN
    com.mojang.authlib.Agent agent -> agent
    com.mojang.authlib.GameProfile[] profiles -> profiles
    java.lang.String clientToken -> clientToken
    java.lang.String accessToken -> accessToken
    boolean isOnline -> isOnline
    45:46:void <init>(com.mojang.authlib.yggdrasil.YggdrasilAuthenticationService,java.lang.String,com.mojang.authlib.Agent) -> <init>
    49:59:void <init>(com.mojang.authlib.yggdrasil.YggdrasilAuthenticationService,java.lang.String,com.mojang.authlib.Agent,com.mojang.authlib.Environment) -> <init>
    63:63:boolean canLogIn() -> canLogIn
    68:79:void logIn() -> logIn
    82:119:void logInWithPassword() -> logInWithPassword
    122:129:void updateUserProperties(com.mojang.authlib.yggdrasil.response.User) -> updateUserProperties
    132:177:void logInWithToken() -> logInWithToken
    180:185:boolean checkTokenValidity() -> checkTokenValidity
    191:196:void logOut() -> logOut
    200:200:com.mojang.authlib.GameProfile[] getAvailableProfiles() -> getAvailableProfiles
    205:205:boolean isLoggedIn() -> isLoggedIn
    210:210:boolean canPlayOnline() -> canPlayOnline
    215:235:void selectGameProfile(com.mojang.authlib.GameProfile) -> selectGameProfile
    239:242:void loadFromStorage(java.util.Map) -> loadFromStorage
    246:252:java.util.Map saveForStorage() -> saveForStorage
    260:263:java.lang.String getSessionToken() -> getSessionToken
    269:269:java.lang.String getAuthenticatedToken() -> getAuthenticatedToken
    273:273:com.mojang.authlib.Agent getAgent() -> getAgent
    278:285:java.lang.String toString() -> toString
    293:293:com.mojang.authlib.yggdrasil.YggdrasilAuthenticationService getAuthenticationService() -> getAuthenticationService
    27:27:com.mojang.authlib.HttpAuthenticationService getAuthenticationService() -> getAuthenticationService
    27:27:com.mojang.authlib.AuthenticationService getAuthenticationService() -> getAuthenticationService
    28:28:void <clinit>() -> <clinit>
com.mojang.authlib.yggdrasil.YggdrassilTelemetryEvent -> com.mojang.authlib.yggdrasil.YggdrassilTelemetryEvent:
    com.mojang.authlib.yggdrasil.YggdrassilTelemetrySession service -> service
    java.lang.String type -> type
    com.google.gson.JsonObject data -> data
    13:19:void <init>(com.mojang.authlib.yggdrasil.YggdrassilTelemetrySession,java.lang.String) -> <init>
    22:25:com.google.gson.JsonObject data() -> data
    30:31:void addProperty(java.lang.String,java.lang.String) -> addProperty
    35:36:void addProperty(java.lang.String,int) -> addProperty
    40:41:void addProperty(java.lang.String,boolean) -> addProperty
    45:46:void addNullProperty(java.lang.String) -> addNullProperty
    50:52:void send() -> send
com.mojang.authlib.yggdrasil.YggdrassilTelemetrySession -> com.mojang.authlib.yggdrasil.YggdrassilTelemetrySession:
    org.apache.logging.log4j.Logger LOGGER -> LOGGER
    java.lang.String SOURCE -> SOURCE
    com.mojang.authlib.minecraft.client.MinecraftClient minecraftClient -> minecraftClient
    java.net.URL routeEvents -> routeEvents
    java.util.concurrent.Executor ioExecutor -> ioExecutor
    com.google.gson.JsonObject globalProperties -> globalProperties
    java.util.function.Consumer eventSetupFunction -> eventSetupFunction
    32:40:void <init>(com.mojang.authlib.minecraft.client.MinecraftClient,com.mojang.authlib.Environment,java.util.concurrent.Executor) -> <init>
    44:44:boolean isEnabled() -> isEnabled
    49:49:com.mojang.authlib.minecraft.TelemetryEvent createNewEvent(java.lang.String) -> createNewEvent
    54:54:com.mojang.authlib.minecraft.TelemetryPropertyContainer globalProperties() -> globalProperties
    59:60:void eventSetupFunction(java.util.function.Consumer) -> eventSetupFunction
    63:77:void sendEvent(java.lang.String,com.google.gson.JsonObject) -> sendEvent
    70:76:void lambda$sendEvent$2(com.mojang.authlib.yggdrasil.request.TelemetryEventsRequest$Event) -> lambda$sendEvent$2
    64:64:void lambda$sendEvent$1(com.google.gson.JsonObject,java.util.Map$Entry) -> lambda$sendEvent$1
    33:33:void lambda$new$0(com.mojang.authlib.minecraft.TelemetryPropertyContainer) -> lambda$new$0
    24:24:void <clinit>() -> <clinit>
com.mojang.authlib.yggdrasil.request.AuthenticationRequest -> com.mojang.authlib.yggdrasil.request.AuthenticationRequest:
    com.mojang.authlib.Agent agent -> agent
    java.lang.String username -> username
    java.lang.String password -> password
    java.lang.String clientToken -> clientToken
    boolean requestUser -> requestUser
    10:17:void <init>(com.mojang.authlib.Agent,java.lang.String,java.lang.String,java.lang.String) -> <init>
com.mojang.authlib.yggdrasil.request.JoinMinecraftServerRequest -> com.mojang.authlib.yggdrasil.request.JoinMinecraftServerRequest:
    java.lang.String accessToken -> accessToken
    java.util.UUID selectedProfile -> selectedProfile
    java.lang.String serverId -> serverId
    5:5:void <init>() -> <init>
com.mojang.authlib.yggdrasil.request.RefreshRequest -> com.mojang.authlib.yggdrasil.request.RefreshRequest:
    java.lang.String clientToken -> clientToken
    java.lang.String accessToken -> accessToken
    com.mojang.authlib.GameProfile selectedProfile -> selectedProfile
    boolean requestUser -> requestUser
    12:13:void <init>(java.lang.String,java.lang.String) -> <init>
    9:19:void <init>(java.lang.String,java.lang.String,com.mojang.authlib.GameProfile) -> <init>
com.mojang.authlib.yggdrasil.request.TelemetryEventsRequest -> com.mojang.authlib.yggdrasil.request.TelemetryEventsRequest:
    java.util.List events -> events
    11:13:void <init>(java.util.List) -> <init>
com.mojang.authlib.yggdrasil.request.TelemetryEventsRequest$Event -> com.mojang.authlib.yggdrasil.request.TelemetryEventsRequest$Event:
    java.lang.String source -> source
    java.lang.String name -> name
    long timestamp -> timestamp
    com.google.gson.JsonObject data -> data
    21:26:void <init>(java.lang.String,java.lang.String,java.time.Instant,com.google.gson.JsonObject) -> <init>
com.mojang.authlib.yggdrasil.request.ValidateRequest -> com.mojang.authlib.yggdrasil.request.ValidateRequest:
    java.lang.String clientToken -> clientToken
    java.lang.String accessToken -> accessToken
    7:10:void <init>(java.lang.String,java.lang.String) -> <init>
com.mojang.authlib.yggdrasil.response.AuthenticationResponse -> com.mojang.authlib.yggdrasil.response.AuthenticationResponse:
    java.lang.String accessToken -> accessToken
    java.lang.String clientToken -> clientToken
    com.mojang.authlib.GameProfile selectedProfile -> selectedProfile
    com.mojang.authlib.GameProfile[] availableProfiles -> availableProfiles
    com.mojang.authlib.yggdrasil.response.User user -> user
    5:5:void <init>() -> <init>
    13:13:java.lang.String getAccessToken() -> getAccessToken
    17:17:java.lang.String getClientToken() -> getClientToken
    21:21:com.mojang.authlib.GameProfile[] getAvailableProfiles() -> getAvailableProfiles
    25:25:com.mojang.authlib.GameProfile getSelectedProfile() -> getSelectedProfile
    29:29:com.mojang.authlib.yggdrasil.response.User getUser() -> getUser
com.mojang.authlib.yggdrasil.response.BlockListResponse -> com.mojang.authlib.yggdrasil.response.BlockListResponse:
    java.util.Set blockedProfiles -> blockedProfiles
    6:6:void <init>() -> <init>
    18:18:java.util.Set getBlockedProfiles() -> getBlockedProfiles
com.mojang.authlib.yggdrasil.response.ErrorResponse -> com.mojang.authlib.yggdrasil.response.ErrorResponse:
    java.lang.String path -> path
    java.lang.String error -> error
    java.lang.String errorMessage -> errorMessage
    java.util.Map details -> details
    22:27:void <init>(java.lang.String,java.lang.String,java.lang.String,java.util.Map) -> <init>
    30:30:java.lang.String getPath() -> getPath
    34:34:java.lang.String getError() -> getError
    38:38:java.util.Map getDetails() -> getDetails
    42:42:java.lang.String getErrorMessage() -> getErrorMessage
    47:52:java.lang.String toString() -> toString
com.mojang.authlib.yggdrasil.response.HasJoinedMinecraftServerResponse -> com.mojang.authlib.yggdrasil.response.HasJoinedMinecraftServerResponse:
    java.util.UUID id -> id
    com.mojang.authlib.properties.PropertyMap properties -> properties
    7:7:void <init>() -> <init>
    12:12:java.util.UUID getId() -> getId
    16:16:com.mojang.authlib.properties.PropertyMap getProperties() -> getProperties
com.mojang.authlib.yggdrasil.response.MinecraftProfilePropertiesResponse -> com.mojang.authlib.yggdrasil.response.MinecraftProfilePropertiesResponse:
    java.util.UUID id -> id
    java.lang.String name -> name
    com.mojang.authlib.properties.PropertyMap properties -> properties
    7:7:void <init>() -> <init>
    13:13:java.util.UUID getId() -> getId
    17:17:java.lang.String getName() -> getName
    21:21:com.mojang.authlib.properties.PropertyMap getProperties() -> getProperties
com.mojang.authlib.yggdrasil.response.MinecraftTexturesPayload -> com.mojang.authlib.yggdrasil.response.MinecraftTexturesPayload:
    long timestamp -> timestamp
    java.util.UUID profileId -> profileId
    java.lang.String profileName -> profileName
    boolean isPublic -> isPublic
    java.util.Map textures -> textures
    8:8:void <init>() -> <init>
    16:16:long getTimestamp() -> getTimestamp
    20:20:java.util.UUID getProfileId() -> getProfileId
    24:24:java.lang.String getProfileName() -> getProfileName
    28:28:boolean isPublic() -> isPublic
    32:32:java.util.Map getTextures() -> getTextures
com.mojang.authlib.yggdrasil.response.PrivilegesResponse -> com.mojang.authlib.yggdrasil.response.PrivilegesResponse:
    com.mojang.authlib.yggdrasil.response.PrivilegesResponse$Privileges privileges -> privileges
    3:19:void <init>() -> <init>
    22:22:com.mojang.authlib.yggdrasil.response.PrivilegesResponse$Privileges getPrivileges() -> getPrivileges
com.mojang.authlib.yggdrasil.response.PrivilegesResponse$Privileges -> com.mojang.authlib.yggdrasil.response.PrivilegesResponse$Privileges:
    com.mojang.authlib.yggdrasil.response.PrivilegesResponse$Privileges$Privilege onlineChat -> onlineChat
    com.mojang.authlib.yggdrasil.response.PrivilegesResponse$Privileges$Privilege multiplayerServer -> multiplayerServer
    com.mojang.authlib.yggdrasil.response.PrivilegesResponse$Privileges$Privilege multiplayerRealms -> multiplayerRealms
    com.mojang.authlib.yggdrasil.response.PrivilegesResponse this$0 -> this$0
    25:28:void <init>(com.mojang.authlib.yggdrasil.response.PrivilegesResponse) -> <init>
    31:31:com.mojang.authlib.yggdrasil.response.PrivilegesResponse$Privileges$Privilege getOnlineChat() -> getOnlineChat
    35:35:com.mojang.authlib.yggdrasil.response.PrivilegesResponse$Privileges$Privilege getMultiplayerServer() -> getMultiplayerServer
    39:39:com.mojang.authlib.yggdrasil.response.PrivilegesResponse$Privileges$Privilege getMultiplayerRealms() -> getMultiplayerRealms
com.mojang.authlib.yggdrasil.response.PrivilegesResponse$Privileges$Privilege -> com.mojang.authlib.yggdrasil.response.PrivilegesResponse$Privileges$Privilege:
    boolean enabled -> enabled
    com.mojang.authlib.yggdrasil.response.PrivilegesResponse$Privileges this$1 -> this$1
    42:42:void <init>(com.mojang.authlib.yggdrasil.response.PrivilegesResponse$Privileges) -> <init>
    46:46:boolean isEnabled() -> isEnabled
com.mojang.authlib.yggdrasil.response.ProfileSearchResultsResponse -> com.mojang.authlib.yggdrasil.response.ProfileSearchResultsResponse:
    com.mojang.authlib.GameProfile[] profiles -> profiles
    12:12:void <init>() -> <init>
    16:16:com.mojang.authlib.GameProfile[] getProfiles() -> getProfiles
    12:12:com.mojang.authlib.GameProfile[] access$002(com.mojang.authlib.yggdrasil.response.ProfileSearchResultsResponse,com.mojang.authlib.GameProfile[]) -> access$002
com.mojang.authlib.yggdrasil.response.ProfileSearchResultsResponse$Serializer -> com.mojang.authlib.yggdrasil.response.ProfileSearchResultsResponse$Serializer:
    19:19:void <init>() -> <init>
    22:39:com.mojang.authlib.yggdrasil.response.ProfileSearchResultsResponse deserialize(com.google.gson.JsonElement,java.lang.reflect.Type,com.google.gson.JsonDeserializationContext) -> deserialize
    19:19:java.lang.Object deserialize(com.google.gson.JsonElement,java.lang.reflect.Type,com.google.gson.JsonDeserializationContext) -> deserialize
com.mojang.authlib.yggdrasil.response.RefreshResponse -> com.mojang.authlib.yggdrasil.response.RefreshResponse:
    java.lang.String accessToken -> accessToken
    java.lang.String clientToken -> clientToken
    com.mojang.authlib.GameProfile selectedProfile -> selectedProfile
    com.mojang.authlib.GameProfile[] availableProfiles -> availableProfiles
    com.mojang.authlib.yggdrasil.response.User user -> user
    5:5:void <init>() -> <init>
    13:13:java.lang.String getAccessToken() -> getAccessToken
    17:17:java.lang.String getClientToken() -> getClientToken
    21:21:com.mojang.authlib.GameProfile[] getAvailableProfiles() -> getAvailableProfiles
    25:25:com.mojang.authlib.GameProfile getSelectedProfile() -> getSelectedProfile
    29:29:com.mojang.authlib.yggdrasil.response.User getUser() -> getUser
com.mojang.authlib.yggdrasil.response.Response -> com.mojang.authlib.yggdrasil.response.Response:
    java.lang.String error -> error
    java.lang.String errorMessage -> errorMessage
    java.lang.String cause -> cause
    3:3:void <init>() -> <init>
    9:9:java.lang.String getError() -> getError
    13:13:java.lang.String getCause() -> getCause
    17:17:java.lang.String getErrorMessage() -> getErrorMessage
    21:22:void setError(java.lang.String) -> setError
    25:26:void setErrorMessage(java.lang.String) -> setErrorMessage
    29:30:void setCause(java.lang.String) -> setCause
com.mojang.authlib.yggdrasil.response.User -> com.mojang.authlib.yggdrasil.response.User:
    java.lang.String id -> id
    com.mojang.authlib.properties.PropertyMap properties -> properties
    5:5:void <init>() -> <init>
    10:10:java.lang.String getId() -> getId
    14:14:com.mojang.authlib.properties.PropertyMap getProperties() -> getProperties
com.mojang.authlib.yggdrasil.response.UserAttributesResponse -> com.mojang.authlib.yggdrasil.response.UserAttributesResponse:
    com.mojang.authlib.yggdrasil.response.UserAttributesResponse$Privileges privileges -> privileges
    com.mojang.authlib.yggdrasil.response.UserAttributesResponse$ProfanityFilterPreferences profanityFilterPreferences -> profanityFilterPreferences
    5:5:void <init>() -> <init>
    14:14:com.mojang.authlib.yggdrasil.response.UserAttributesResponse$Privileges getPrivileges() -> getPrivileges
    19:19:com.mojang.authlib.yggdrasil.response.UserAttributesResponse$ProfanityFilterPreferences getProfanityFilterPreferences() -> getProfanityFilterPreferences
com.mojang.authlib.yggdrasil.response.UserAttributesResponse$Privileges -> com.mojang.authlib.yggdrasil.response.UserAttributesResponse$Privileges:
    com.mojang.authlib.yggdrasil.response.UserAttributesResponse$Privileges$Privilege onlineChat -> onlineChat
    com.mojang.authlib.yggdrasil.response.UserAttributesResponse$Privileges$Privilege multiplayerServer -> multiplayerServer
    com.mojang.authlib.yggdrasil.response.UserAttributesResponse$Privileges$Privilege multiplayerRealms -> multiplayerRealms
    com.mojang.authlib.yggdrasil.response.UserAttributesResponse$Privileges$Privilege telemetry -> telemetry
    22:22:void <init>() -> <init>
    33:33:boolean getOnlineChat() -> getOnlineChat
    37:37:boolean getMultiplayerServer() -> getMultiplayerServer
    41:41:boolean getMultiplayerRealms() -> getMultiplayerRealms
    45:45:boolean getTelemetry() -> getTelemetry
com.mojang.authlib.yggdrasil.response.UserAttributesResponse$Privileges$Privilege -> com.mojang.authlib.yggdrasil.response.UserAttributesResponse$Privileges$Privilege:
    boolean enabled -> enabled
    com.mojang.authlib.yggdrasil.response.UserAttributesResponse$Privileges this$0 -> this$0
    48:48:void <init>(com.mojang.authlib.yggdrasil.response.UserAttributesResponse$Privileges) -> <init>
    48:48:boolean access$000(com.mojang.authlib.yggdrasil.response.UserAttributesResponse$Privileges$Privilege) -> access$000
com.mojang.authlib.yggdrasil.response.UserAttributesResponse$ProfanityFilterPreferences -> com.mojang.authlib.yggdrasil.response.UserAttributesResponse$ProfanityFilterPreferences:
    boolean profanityFilterOn -> profanityFilterOn
    53:53:void <init>() -> <init>
    57:57:boolean isEnabled() -> isEnabled
com.mojang.util.QueueLogAppender -> com.mojang.util.QueueLogAppender:
    int MAX_CAPACITY -> MAX_CAPACITY
    java.util.Map QUEUES -> QUEUES
    java.util.concurrent.locks.ReadWriteLock QUEUE_LOCK -> QUEUE_LOCK
    java.util.concurrent.BlockingQueue queue -> queue
    30:32:void <init>(java.lang.String,org.apache.logging.log4j.core.Filter,org.apache.logging.log4j.core.Layout,boolean,java.util.concurrent.BlockingQueue) -> <init>
    36:40:void append(org.apache.logging.log4j.core.LogEvent) -> append
    44:67:com.mojang.util.QueueLogAppender createAppender(java.lang.String,java.lang.String,org.apache.logging.log4j.core.Layout,org.apache.logging.log4j.core.Filter,java.lang.String) -> createAppender
    71:82:java.lang.String getNextLogEvent(java.lang.String) -> getNextLogEvent
    24:25:void <clinit>() -> <clinit>
com.mojang.util.UUIDTypeAdapter -> com.mojang.util.UUIDTypeAdapter:
    10:10:void <init>() -> <init>
    13:14:void write(com.google.gson.stream.JsonWriter,java.util.UUID) -> write
    18:18:java.util.UUID read(com.google.gson.stream.JsonReader) -> read
    22:22:java.lang.String fromUUID(java.util.UUID) -> fromUUID
    26:26:java.util.UUID fromString(java.lang.String) -> fromString
    10:10:java.lang.Object read(com.google.gson.stream.JsonReader) -> read
    10:10:void write(com.google.gson.stream.JsonWriter,java.lang.Object) -> write
javax.annotation.CheckForNull -> launcher.keepErJErRy6HE:
javax.annotation.CheckForSigned -> launcher.KeePerjeRryt52:
javax.annotation.CheckReturnValue -> launcher.keEPERjERryabM:
    javax.annotation.meta.When when() -> keepErJErRy6HE
javax.annotation.Detainted -> launcher.keEpErjeRRYsAK:
javax.annotation.MatchesPattern -> launcher.KeEperJErryz5T:
    java.lang.String value() -> keepErJErRy6HE
    int flags() -> keepErJErRy6HE
javax.annotation.MatchesPattern$Checker -> launcher.keePErjerrYnmV:
    26:26:void <init>() -> <init>
    28:31:javax.annotation.meta.When forConstantValue(javax.annotation.MatchesPattern,java.lang.Object) -> keepErJErRy6HE
    26:26:javax.annotation.meta.When forConstantValue(java.lang.annotation.Annotation,java.lang.Object) -> keepErJErRy6HE
javax.annotation.Nonnegative -> launcher.kEepERjerryhdF:
    javax.annotation.meta.When when() -> keepErJErRy6HE
javax.annotation.Nonnegative$Checker -> launcher.KEEPeRjErrYXff:
    22:22:void <init>() -> <init>
    25:41:javax.annotation.meta.When forConstantValue(javax.annotation.Nonnegative,java.lang.Object) -> keepErJErRy6HE
    22:22:javax.annotation.meta.When forConstantValue(java.lang.annotation.Annotation,java.lang.Object) -> keepErJErRy6HE
javax.annotation.Nonnull -> launcher.keePErjERRy57k:
    javax.annotation.meta.When when() -> keepErJErRy6HE
javax.annotation.Nonnull$Checker -> launcher.keEPErJERRYlXM:
    24:24:void <init>() -> <init>
    27:29:javax.annotation.meta.When forConstantValue(javax.annotation.Nonnull,java.lang.Object) -> keepErJErRy6HE
    24:24:javax.annotation.meta.When forConstantValue(java.lang.annotation.Annotation,java.lang.Object) -> keepErJErRy6HE
javax.annotation.Nullable -> launcher.KeeperJerRyoBb:
javax.annotation.OverridingMethodsMustInvokeSuper -> launcher.kEEPErjErRYOqZ:
javax.annotation.ParametersAreNonnullByDefault -> launcher.KeEPERJErry5NT:
javax.annotation.ParametersAreNullableByDefault -> launcher.KeEPErJErrYwYP:
javax.annotation.PropertyKey -> launcher.KEeperJerrYuCQ:
    javax.annotation.meta.When when() -> keepErJErRy6HE
javax.annotation.RegEx -> launcher.kEEPerjeRRy6uh:
    javax.annotation.meta.When when() -> keepErJErRy6HE
javax.annotation.RegEx$Checker -> launcher.KeePerJeRrY10e:
    26:26:void <init>() -> <init>
    29:37:javax.annotation.meta.When forConstantValue(javax.annotation.RegEx,java.lang.Object) -> keepErJErRy6HE
    26:26:javax.annotation.meta.When forConstantValue(java.lang.annotation.Annotation,java.lang.Object) -> keepErJErRy6HE
javax.annotation.Signed -> launcher.KeePERjeRrYwGV:
javax.annotation.Syntax -> launcher.kEEpeRjERryUJl:
    java.lang.String value() -> keepErJErRy6HE
    javax.annotation.meta.When when() -> keepErJErRy6HE
javax.annotation.Tainted -> launcher.KeePeRJErRyoWd:
javax.annotation.Untainted -> launcher.kEEPErjerRyItY:
    javax.annotation.meta.When when() -> keepErJErRy6HE
javax.annotation.WillClose -> launcher.keEPErjERrY1tw:
javax.annotation.WillCloseWhenClosed -> launcher.kEEpErJERRYmIE:
javax.annotation.WillNotClose -> launcher.keEpErjERrYAt4:
javax.annotation.concurrent.GuardedBy -> launcher.KeEpErjERrynz1:
    java.lang.String value() -> keepErJErRy6HE
javax.annotation.concurrent.Immutable -> launcher.KEEPERJerRY8WG:
javax.annotation.concurrent.NotThreadSafe -> launcher.kEEperjERrYOMC:
javax.annotation.concurrent.ThreadSafe -> launcher.KeepErjERryKEt:
javax.annotation.meta.Exclusive -> launcher.KeEpErJeRRYycB:
javax.annotation.meta.Exhaustive -> launcher.KeEperJeRryIQK:
javax.annotation.meta.TypeQualifier -> launcher.KeEpeRJERrY3B4:
    java.lang.Class applicableTo() -> keepErJErRy6HE
javax.annotation.meta.TypeQualifierDefault -> launcher.KeEPerJERryMGV:
    java.lang.annotation.ElementType[] value() -> keepErJErRy6HE
javax.annotation.meta.TypeQualifierNickname -> launcher.keEpERJeRryfd4:
javax.annotation.meta.TypeQualifierValidator -> launcher.KEePErJeRRygYU:
    javax.annotation.meta.When forConstantValue(java.lang.annotation.Annotation,java.lang.Object) -> keepErJErRy6HE
javax.annotation.meta.When -> launcher.keEperJerrYANO:
    javax.annotation.meta.When ALWAYS -> keepErJErRy6HE
    javax.annotation.meta.When UNKNOWN -> KeePerjeRryt52
    javax.annotation.meta.When MAYBE -> keEPERjERryabM
    javax.annotation.meta.When NEVER -> keEpErjeRRYsAK
    javax.annotation.meta.When[] $VALUES -> keepErJErRy6HE
    13:13:javax.annotation.meta.When[] values() -> values
    13:13:javax.annotation.meta.When valueOf(java.lang.String) -> valueOf
    13:13:void <init>(java.lang.String,int) -> <init>
    13:21:void <clinit>() -> <clinit>
launcher.Launcher -> launcher.KEePErJERryNPa:
    java.lang.String VERSION -> VERSION
    java.lang.String BUILD -> BUILD
    int PROTOCOL_MAGIC -> PROTOCOL_MAGIC
    java.lang.String RUNTIME_DIR -> RUNTIME_DIR
    java.lang.String CONFIG_FILE -> CONFIG_FILE
    java.lang.String INIT_SCRIPT_FILE -> INIT_SCRIPT_FILE
    java.util.concurrent.atomic.AtomicReference CONFIG -> keepErJErRy6HE
    java.util.concurrent.atomic.AtomicBoolean started -> keepErJErRy6HE
    javax.script.ScriptEngine engine -> keepErJErRy6HE
    76:82:void <init>() -> <init>
    87:162:void addLauncherClassBindings(javax.script.ScriptEngine,java.util.Map) -> addLauncherClassBindings
    167:176:void addClassBinding(javax.script.ScriptEngine,java.util.Map,java.lang.String,java.lang.Class) -> addClassBinding
    181:194:launcher.Launcher$Config getConfig() -> getConfig
    200:215:java.net.URL getResourceURL(java.lang.String) -> getResourceURL
    222:222:java.lang.String getVersion() -> getVersion
    227:241:void main(java.lang.String[]) -> main
    247:251:java.lang.String readBuildNumber() -> keepErJErRy6HE
    258:262:java.lang.Object loadScript(java.net.URL) -> loadScript
    268:278:void start(java.lang.String[]) -> start
    282:288:void setScriptBindings() -> keepErJErRy6HE
    64:74:void <clinit>() -> <clinit>
launcher.Launcher$Config -> launcher.keePERjErrYClc:
    java.lang.String ADDRESS_OVERRIDE_PROPERTY -> ADDRESS_OVERRIDE_PROPERTY
    java.lang.String ADDRESS_OVERRIDE -> ADDRESS_OVERRIDE
    java.net.InetSocketAddress address -> address
    java.security.interfaces.RSAPublicKey publicKey -> publicKey
    java.util.Map runtime -> runtime
    308:312:void <init>(java.lang.String,int,java.security.interfaces.RSAPublicKey,java.util.Map) -> <init>
    316:339:void <init>(launcher.serialize.HInput) -> <init>
    344:356:void write(launcher.serialize.HOutput) -> write
    295:295:void <clinit>() -> <clinit>
launcher.LauncherAPI -> launcher.kEEPErjErryBYR:
launcher.client.ClientLauncher -> launcher.KeEperjeRrYrnh:
    java.lang.String SKIN_URL_PROPERTY -> SKIN_URL_PROPERTY
    java.lang.String SKIN_DIGEST_PROPERTY -> SKIN_DIGEST_PROPERTY
    java.lang.String CLOAK_URL_PROPERTY -> CLOAK_URL_PROPERTY
    java.lang.String CLOAK_DIGEST_PROPERTY -> CLOAK_DIGEST_PROPERTY
    java.lang.String[] EMPTY_ARRAY -> keepErJErRy6HE
    java.lang.String MAGICAL_INTEL_OPTION -> keepErJErRy6HE
    java.util.Set BIN_POSIX_PERMISSIONS -> keepErJErRy6HE
    java.nio.file.Path NATIVES_DIR -> keepErJErRy6HE
    java.nio.file.Path RESOURCEPACKS_DIR -> KeePerjeRryt52
    java.util.regex.Pattern UUID_PATTERN -> keepErJErRy6HE
    java.util.concurrent.atomic.AtomicBoolean LAUNCHED -> keepErJErRy6HE
    60:61:void <init>() -> <init>
    66:66:boolean isLaunched() -> isLaunched
    71:71:java.lang.String jvmProperty(java.lang.String,java.lang.String) -> keepErJErRy6HE
    80:153:java.lang.Process launch(java.nio.file.Path,launcher.serialize.signed.SignedObjectHolder,launcher.serialize.signed.SignedObjectHolder,launcher.serialize.signed.SignedObjectHolder,launcher.serialize.signed.SignedObjectHolder,launcher.client.ClientLauncher$Params,boolean) -> launch
    159:222:void main(java.lang.String[]) -> main
    227:227:java.lang.String toHash(java.util.UUID) -> toHash
    233:244:void verifyHDir(java.nio.file.Path,launcher.hasher.HashedDir,launcher.hasher.FileNameMatcher,boolean) -> verifyHDir
    248:315:void addClientArgs(java.util.Collection,launcher.client.ClientProfile,launcher.client.ClientLauncher$Params) -> keepErJErRy6HE
    319:326:void addClientLegacyArgs(java.util.Collection,launcher.client.ClientProfile,launcher.client.ClientLauncher$Params) -> KeePerjeRryt52
    331:362:void launch(launcher.client.ClientProfile,launcher.client.ClientLauncher$Params) -> keepErJErRy6HE
    366:377:java.net.URL[] resolveClassPath(java.nio.file.Path,java.lang.String[]) -> keepErJErRy6HE
    377:377:java.net.URL[] lambda$resolveClassPath$1(int) -> keepErJErRy6HE
    164:164:boolean lambda$main$0(int) -> keepErJErRy6HE
    45:57:void <clinit>() -> <clinit>
launcher.client.ClientLauncher$1 -> launcher.KeepErJeRrY4b2:
launcher.client.ClientLauncher$ClassPathFileVisitor -> launcher.kEEperJERRYGIM:
    java.util.Collection result -> keepErJErRy6HE
    471:473:void <init>(java.util.Collection) -> <init>
    478:482:java.nio.file.FileVisitResult visitFile(java.nio.file.Path,java.nio.file.attribute.BasicFileAttributes) -> keepErJErRy6HE
    466:466:java.nio.file.FileVisitResult visitFile(java.lang.Object,java.nio.file.attribute.BasicFileAttributes) -> visitFile
    466:466:void <init>(java.util.Collection,launcher.client.ClientLauncher$1) -> <init>
launcher.client.ClientLauncher$Params -> launcher.keePerJerryeTT:
    java.nio.file.Path assetDir -> assetDir
    java.nio.file.Path clientDir -> clientDir
    launcher.client.PlayerProfile pp -> pp
    java.lang.String accessToken -> accessToken
    boolean autoEnter -> autoEnter
    boolean fullScreen -> fullScreen
    int ram -> ram
    int width -> width
    int height -> height
    byte[] launcherSign -> keepErJErRy6HE
    408:423:void <init>(byte[],java.nio.file.Path,java.nio.file.Path,launcher.client.PlayerProfile,java.lang.String,boolean,boolean,int,int,int) -> <init>
    427:443:void <init>(launcher.serialize.HInput) -> <init>
    448:463:void write(launcher.serialize.HOutput) -> write
    380:380:byte[] access$000(launcher.client.ClientLauncher$Params) -> keepErJErRy6HE
launcher.client.ClientProfile -> launcher.kEepErJErRyqJr:
    launcher.serialize.stream.StreamObject$Adapter RO_ADAPTER -> RO_ADAPTER
    launcher.hasher.FileNameMatcher ASSET_MATCHER -> keepErJErRy6HE
    launcher.serialize.config.entry.StringConfigEntry version -> keepErJErRy6HE
    launcher.serialize.config.entry.StringConfigEntry assetIndex -> KeePerjeRryt52
    launcher.serialize.config.entry.IntegerConfigEntry sortIndex -> keepErJErRy6HE
    launcher.serialize.config.entry.StringConfigEntry title -> keEPERjERryabM
    launcher.serialize.config.entry.StringConfigEntry serverAddress -> keEpErjeRRYsAK
    launcher.serialize.config.entry.IntegerConfigEntry serverPort -> KeePerjeRryt52
    launcher.serialize.config.entry.StringConfigEntry jvmVersion -> KeEperJErryz5T
    launcher.serialize.config.entry.ListConfigEntry update -> keepErJErRy6HE
    launcher.serialize.config.entry.ListConfigEntry updateExclusions -> KeePerjeRryt52
    launcher.serialize.config.entry.ListConfigEntry updateVerify -> keEPERjERryabM
    launcher.serialize.config.entry.BooleanConfigEntry updateFastCheck -> keepErJErRy6HE
    launcher.serialize.config.entry.StringConfigEntry mainClass -> keePErjerrYnmV
    launcher.serialize.config.entry.ListConfigEntry jvmArgs -> keEpErjeRRYsAK
    launcher.serialize.config.entry.ListConfigEntry classPath -> KeEperJErryz5T
    launcher.serialize.config.entry.ListConfigEntry clientArgs -> keePErjerrYnmV
    50:74:void <init>(launcher.serialize.config.entry.BlockConfigEntry) -> <init>
    79:80:void <init>(launcher.serialize.HInput,boolean) -> <init>
    85:85:int compareTo(launcher.client.ClientProfile) -> keepErJErRy6HE
    91:91:java.lang.String toString() -> toString
    97:97:java.lang.String getAssetIndex() -> getAssetIndex
    103:104:void setAssetIndex(java.lang.String) -> setAssetIndex
    109:109:launcher.hasher.FileNameMatcher getAssetUpdateMatcher() -> getAssetUpdateMatcher
    115:115:java.lang.String[] getClassPath() -> getClassPath
    121:121:java.lang.String[] getClientArgs() -> getClientArgs
    127:130:launcher.hasher.FileNameMatcher getClientUpdateMatcher() -> getClientUpdateMatcher
    135:135:java.lang.String getJvmVersion() -> getJvmVersion
    141:141:java.lang.String[] getJvmArgs() -> getJvmArgs
    147:147:java.lang.String getMainClass() -> getMainClass
    153:153:java.lang.String getServerAddress() -> getServerAddress
    159:159:int getServerPort() -> getServerPort
    165:165:java.net.InetSocketAddress getServerSocketAddress() -> getServerSocketAddress
    171:171:int getSortIndex() -> getSortIndex
    177:177:java.lang.String getTitle() -> getTitle
    183:184:void setTitle(java.lang.String) -> setTitle
    189:189:java.lang.String getVersion() -> getVersion
    195:196:void setVersion(java.lang.String) -> setVersion
    201:201:boolean isUpdateFastCheck() -> isUpdateFastCheck
    208:226:void verify() -> verify
    16:16:int compareTo(java.lang.Object) -> compareTo
    141:141:java.lang.String[] lambda$getJvmArgs$6(int) -> keepErJErRy6HE
    129:129:java.lang.String[] lambda$getClientUpdateMatcher$5(int) -> KeePerjeRryt52
    128:128:java.lang.String[] lambda$getClientUpdateMatcher$4(int) -> keEPERjERryabM
    127:127:java.lang.String[] lambda$getClientUpdateMatcher$3(int) -> keEpErjeRRYsAK
    121:121:java.lang.String[] lambda$getClientArgs$2(int) -> KeEperJErryz5T
    115:115:java.lang.String[] lambda$getClassPath$1(int) -> keePErjerrYnmV
    20:20:launcher.client.ClientProfile lambda$static$0(launcher.serialize.HInput) -> keepErJErRy6HE
    20:21:void <clinit>() -> <clinit>
launcher.client.ClientProfile$Version -> launcher.KEEPERjeRRyDT2:
    230:230:void <init>() -> <init>
    232:241:int compare(java.lang.String,java.lang.String) -> keepErJErRy6HE
launcher.client.PlayerProfile -> launcher.KeePErjerRy6bP:
    java.util.UUID uuid -> uuid
    java.lang.String username -> username
    launcher.client.PlayerProfile$Texture skin -> skin
    launcher.client.PlayerProfile$Texture cloak -> cloak
    30:35:void <init>(launcher.serialize.HInput) -> <init>
    39:44:void <init>(java.util.UUID,java.lang.String,launcher.client.PlayerProfile$Texture,launcher.client.PlayerProfile$Texture) -> <init>
    49:49:launcher.client.PlayerProfile newOfflineProfile(java.lang.String) -> newOfflineProfile
    55:55:java.util.UUID offlineUUID(java.lang.String) -> offlineUUID
    61:75:void write(launcher.serialize.HOutput) -> write
launcher.client.PlayerProfile$Texture -> launcher.kEeperJErrYOoH:
    launcher.helper.SecurityHelper$DigestAlgorithm DIGEST_ALGO -> keepErJErRy6HE
    java.lang.String url -> url
    byte[] digest -> digest
    89:92:void <init>(java.lang.String,byte[]) -> <init>
    96:112:void <init>(java.lang.String,boolean) -> <init>
    116:119:void <init>(launcher.serialize.HInput) -> <init>
    124:126:void write(launcher.serialize.HOutput) -> write
    79:79:void <clinit>() -> <clinit>
launcher.client.ServerPinger -> launcher.kEEpERjErryuSa:
    java.lang.String LEGACY_PING_HOST_MAGIC -> keepErJErRy6HE
    java.lang.String LEGACY_PING_HOST_CHANNEL -> KeePerjeRryt52
    java.util.regex.Pattern LEGACY_PING_HOST_DELIMETER -> keepErJErRy6HE
    int PACKET_LENGTH -> keepErJErRy6HE
    java.net.InetSocketAddress address -> keepErJErRy6HE
    java.lang.String version -> keEPERjERryabM
    java.lang.Object cacheLock -> keepErJErRy6HE
    launcher.client.ServerPinger$Result cache -> keepErJErRy6HE
    java.lang.Throwable cacheError -> keepErJErRy6HE
    long cacheUntil -> keepErJErRy6HE
    35:45:void <init>(java.net.InetSocketAddress,java.lang.String) -> <init>
    49:51:java.lang.String readUTF16String(launcher.serialize.HInput) -> keepErJErRy6HE
    56:58:void writeUTF16String(launcher.serialize.HOutput,java.lang.String) -> keepErJErRy6HE
    63:92:launcher.client.ServerPinger$Result ping() -> ping
    97:105:launcher.client.ServerPinger$Result doPing() -> keepErJErRy6HE
    110:174:launcher.client.ServerPinger$Result legacyPing(launcher.serialize.HInput,launcher.serialize.HOutput,boolean) -> keepErJErRy6HE
    181:230:launcher.client.ServerPinger$Result modernPing(launcher.serialize.HInput,launcher.serialize.HOutput) -> keepErJErRy6HE
    27:27:void <clinit>() -> <clinit>
launcher.client.ServerPinger$Result -> launcher.kEePerjErRy09c:
    int onlinePlayers -> onlinePlayers
    int maxPlayers -> maxPlayers
    java.lang.String raw -> raw
    243:249:void <init>(int,int,java.lang.String) -> <init>
    254:254:boolean isOverfilled() -> isOverfilled
launcher.hasher.DirWatcher -> launcher.KeEPerjErRyR55:
    boolean FILE_TREE_SUPPORTED -> keepErJErRy6HE
    java.nio.file.WatchEvent$Modifier[] MODIFIERS -> keepErJErRy6HE
    java.nio.file.WatchEvent$Modifier[] FILE_TREE_MODIFIERS -> KeePerjeRryt52
    java.nio.file.WatchEvent$Kind[] KINDS -> keepErJErRy6HE
    java.nio.file.Path dir -> keepErJErRy6HE
    launcher.hasher.HashedDir hdir -> keepErJErRy6HE
    launcher.hasher.FileNameMatcher matcher -> keepErJErRy6HE
    java.nio.file.WatchService service -> keepErJErRy6HE
    boolean digest -> KeePerjeRryt52
    45:61:void <init>(java.nio.file.Path,launcher.hasher.HashedDir,launcher.hasher.FileNameMatcher,boolean) -> <init>
    65:67:void handleError(java.lang.Throwable) -> keepErJErRy6HE
    71:76:java.util.Deque toPath(java.lang.Iterable) -> keepErJErRy6HE
    83:84:void close() -> close
    92:102:void run() -> run
    106:141:void processKey(java.nio.file.WatchKey) -> keepErJErRy6HE
    145:149:void processLoop() -> keepErJErRy6HE
    21:21:java.nio.file.Path access$100(launcher.hasher.DirWatcher) -> keepErJErRy6HE
    21:21:java.nio.file.WatchService access$200(launcher.hasher.DirWatcher) -> keepErJErRy6HE
    21:21:java.nio.file.WatchEvent$Kind[] access$300() -> keepErJErRy6HE
    21:21:java.nio.file.WatchEvent$Modifier[] access$400() -> keepErJErRy6HE
    21:21:launcher.hasher.FileNameMatcher access$500(launcher.hasher.DirWatcher) -> keepErJErRy6HE
    23:32:void <clinit>() -> <clinit>
launcher.hasher.DirWatcher$1 -> launcher.kEEpeRJERRYUDQ:
launcher.hasher.DirWatcher$RegisterFileVisitor -> launcher.KEEpERJeRrYaXw:
    java.util.Deque path -> keepErJErRy6HE
    launcher.hasher.DirWatcher this$0 -> keepErJErRy6HE
    151:153:void <init>(launcher.hasher.DirWatcher) -> <init>
    158:163:java.nio.file.FileVisitResult postVisitDirectory(java.nio.file.Path,java.io.IOException) -> keepErJErRy6HE
    169:185:java.nio.file.FileVisitResult preVisitDirectory(java.nio.file.Path,java.nio.file.attribute.BasicFileAttributes) -> keepErJErRy6HE
    151:151:java.nio.file.FileVisitResult postVisitDirectory(java.lang.Object,java.io.IOException) -> postVisitDirectory
    151:151:java.nio.file.FileVisitResult preVisitDirectory(java.lang.Object,java.nio.file.attribute.BasicFileAttributes) -> preVisitDirectory
    151:151:void <init>(launcher.hasher.DirWatcher,launcher.hasher.DirWatcher$1) -> <init>
launcher.hasher.FileNameMatcher -> launcher.KeepeRjeRrycgq:
    launcher.hasher.FileNameMatcher$Entry[] NO_ENTRIES -> keepErJErRy6HE
    launcher.hasher.FileNameMatcher$Entry[] update -> KeePerjeRryt52
    launcher.hasher.FileNameMatcher$Entry[] verify -> keEPERjERryabM
    launcher.hasher.FileNameMatcher$Entry[] exclusions -> keEpErjeRRYsAK
    22:26:void <init>(java.lang.String[],java.lang.String[],java.lang.String[]) -> <init>
    29:33:void <init>(launcher.hasher.FileNameMatcher$Entry[],launcher.hasher.FileNameMatcher$Entry[],launcher.hasher.FileNameMatcher$Entry[]) -> <init>
    37:37:boolean anyMatch(launcher.hasher.FileNameMatcher$Entry[],java.util.Collection) -> keepErJErRy6HE
    42:42:launcher.hasher.FileNameMatcher$Entry[] toEntries(java.lang.String[]) -> keepErJErRy6HE
    48:48:boolean shouldUpdate(java.util.Collection) -> shouldUpdate
    54:54:boolean shouldVerify(java.util.Collection) -> shouldVerify
    60:60:launcher.hasher.FileNameMatcher verifyOnly() -> verifyOnly
    42:42:launcher.hasher.FileNameMatcher$Entry[] lambda$toEntries$2(int) -> keepErJErRy6HE
    42:42:launcher.hasher.FileNameMatcher$Entry lambda$toEntries$1(java.lang.CharSequence) -> keepErJErRy6HE
    37:37:boolean lambda$anyMatch$0(java.util.Collection,launcher.hasher.FileNameMatcher$Entry) -> keepErJErRy6HE
    13:13:void <clinit>() -> <clinit>
launcher.hasher.FileNameMatcher$1 -> launcher.kEepERJErRyMwq:
launcher.hasher.FileNameMatcher$Entry -> launcher.kEEpErJerryq4E:
    java.util.regex.Pattern SPLITTER -> keepErJErRy6HE
    java.util.regex.Pattern[] parts -> keepErJErRy6HE
    69:71:void <init>(java.lang.CharSequence) -> <init>
    75:92:boolean matches(java.util.Collection) -> keepErJErRy6HE
    70:70:java.util.regex.Pattern[] lambda$new$0(int) -> keepErJErRy6HE
    63:63:void <init>(java.lang.CharSequence,launcher.hasher.FileNameMatcher$1) -> <init>
    63:63:boolean access$100(launcher.hasher.FileNameMatcher$Entry,java.util.Collection) -> keepErJErRy6HE
    65:65:void <clinit>() -> <clinit>
launcher.hasher.HashedDir -> launcher.KeEpERJeRRy4zK:
    java.util.Map map -> keepErJErRy6HE
    22:27:void <init>() -> <init>
    22:33:void <init>(java.nio.file.Path,launcher.hasher.FileNameMatcher,boolean,boolean) -> <init>
    22:61:void <init>(launcher.serialize.HInput) -> <init>
    66:66:launcher.hasher.HashedEntry$Type getType() -> getType
    72:72:long size() -> size
    78:89:void write(launcher.serialize.HOutput) -> write
    94:96:launcher.hasher.HashedDir$Diff diff(launcher.hasher.HashedDir,launcher.hasher.FileNameMatcher) -> diff
    102:102:launcher.hasher.HashedEntry getEntry(java.lang.String) -> getEntry
    108:108:boolean isEmpty() -> isEmpty
    114:114:java.util.Map map() -> map
    120:130:launcher.hasher.HashedEntry resolve(java.lang.Iterable) -> resolve
    135:194:launcher.hasher.HashedDir sideDiff(launcher.hasher.HashedDir,launcher.hasher.FileNameMatcher,java.util.Deque,boolean) -> keepErJErRy6HE
    20:20:java.util.Map access$200(launcher.hasher.HashedDir) -> keepErJErRy6HE
launcher.hasher.HashedDir$1 -> launcher.KeeperjerRyakP:
    int[] $SwitchMap$launcher$hasher$HashedEntry$Type -> keepErJErRy6HE
    46:46:void <clinit>() -> <clinit>
launcher.hasher.HashedDir$Diff -> launcher.KEEPErjeRryH1J:
    launcher.hasher.HashedDir mismatch -> mismatch
    launcher.hasher.HashedDir extra -> extra
    205:208:void <init>(launcher.hasher.HashedDir,launcher.hasher.HashedDir) -> <init>
    213:213:boolean isSame() -> isSame
    197:197:void <init>(launcher.hasher.HashedDir,launcher.hasher.HashedDir,launcher.hasher.HashedDir$1) -> <init>
launcher.hasher.HashedDir$HashFileVisitor -> launcher.KeepERJerrYYq7:
    java.nio.file.Path dir -> keepErJErRy6HE
    launcher.hasher.FileNameMatcher matcher -> keepErJErRy6HE
    boolean allowSymlinks -> keepErJErRy6HE
    boolean digest -> KeePerjeRryt52
    java.util.Deque path -> keepErJErRy6HE
    java.util.Deque stack -> KeePerjeRryt52
    launcher.hasher.HashedDir current -> KeePerjeRryt52
    launcher.hasher.HashedDir this$0 -> keepErJErRy6HE
    223:234:void <init>(launcher.hasher.HashedDir,java.nio.file.Path,launcher.hasher.FileNameMatcher,boolean,boolean) -> <init>
    239:251:java.nio.file.FileVisitResult postVisitDirectory(java.nio.file.Path,java.io.IOException) -> keepErJErRy6HE
    257:276:java.nio.file.FileVisitResult preVisitDirectory(java.nio.file.Path,java.nio.file.attribute.BasicFileAttributes) -> keepErJErRy6HE
    283:292:java.nio.file.FileVisitResult visitFile(java.nio.file.Path,java.nio.file.attribute.BasicFileAttributes) -> KeePerjeRryt52
    217:217:java.nio.file.FileVisitResult postVisitDirectory(java.lang.Object,java.io.IOException) -> postVisitDirectory
    217:217:java.nio.file.FileVisitResult visitFile(java.lang.Object,java.nio.file.attribute.BasicFileAttributes) -> visitFile
    217:217:java.nio.file.FileVisitResult preVisitDirectory(java.lang.Object,java.nio.file.attribute.BasicFileAttributes) -> preVisitDirectory
    217:217:void <init>(launcher.hasher.HashedDir,java.nio.file.Path,launcher.hasher.FileNameMatcher,boolean,boolean,launcher.hasher.HashedDir$1) -> <init>
launcher.hasher.HashedEntry -> launcher.keePeRjErrypC2:
    boolean flag -> flag
    11:11:void <init>() -> <init>
    launcher.hasher.HashedEntry$Type getType() -> getType
    long size() -> size
launcher.hasher.HashedEntry$Type -> launcher.kEepErjERry3Xj:
    launcher.hasher.HashedEntry$Type DIR -> DIR
    launcher.hasher.HashedEntry$Type FILE -> FILE
    launcher.serialize.stream.EnumSerializer SERIALIZER -> SERIALIZER
    int n -> n
    launcher.hasher.HashedEntry$Type[] $VALUES -> $VALUES
    22:22:launcher.hasher.HashedEntry$Type[] values() -> values
    22:22:launcher.hasher.HashedEntry$Type valueOf(java.lang.String) -> valueOf
    30:32:void <init>(java.lang.String,int,int) -> <init>
    36:36:launcher.hasher.HashedEntry$Type read(launcher.serialize.HInput) -> read
    42:42:int getNumber() -> getNumber
    22:26:void <clinit>() -> <clinit>
launcher.hasher.HashedFile -> launcher.kEePeRjErryMYl:
    launcher.helper.SecurityHelper$DigestAlgorithm DIGEST_ALGO -> keepErJErRy6HE
    long size -> size
    byte[] digest -> keepErJErRy6HE
    26:29:void <init>(long,byte[]) -> <init>
    34:35:void <init>(java.nio.file.Path,long,boolean) -> <init>
    40:41:void <init>(launcher.serialize.HInput) -> <init>
    46:46:launcher.hasher.HashedEntry$Type getType() -> getType
    52:52:long size() -> size
    58:64:void write(launcher.serialize.HOutput) -> write
    69:69:boolean isSame(launcher.hasher.HashedFile) -> isSame
    75:86:boolean isSame(java.nio.file.Path,boolean) -> isSame
    92:92:boolean isSameDigest(byte[]) -> isSameDigest
    17:17:void <clinit>() -> <clinit>
launcher.helper.CommonHelper -> launcher.KEePeRJeRRy8Jj:
    java.lang.String[] SCRIPT_ENGINE_ARGS -> keepErJErRy6HE
    14:15:void <init>() -> <init>
    20:20:java.lang.String low(java.lang.String) -> low
    26:26:javax.script.ScriptEngine newScriptEngine() -> newScriptEngine
    32:38:java.lang.Thread newThread(java.lang.String,boolean,java.lang.Runnable) -> newThread
    44:48:java.lang.String replace(java.lang.String,java.lang.String[]) -> replace
    11:11:void <clinit>() -> <clinit>
launcher.helper.IOHelper -> launcher.KEepErjeRRyzrC:
    java.nio.charset.Charset UNICODE_CHARSET -> UNICODE_CHARSET
    java.nio.charset.Charset ASCII_CHARSET -> ASCII_CHARSET
    int SOCKET_TIMEOUT -> SOCKET_TIMEOUT
    int HTTP_TIMEOUT -> HTTP_TIMEOUT
    int BUFFER_SIZE -> BUFFER_SIZE
    java.lang.String CROSS_SEPARATOR -> CROSS_SEPARATOR
    java.nio.file.FileSystem FS -> FS
    java.lang.String PLATFORM_SEPARATOR -> PLATFORM_SEPARATOR
    boolean POSIX -> POSIX
    java.nio.file.Path JVM_DIR -> JVM_DIR
    java.nio.file.Path HOME_DIR -> HOME_DIR
    java.nio.file.Path HOME_DIR_WIN -> HOME_DIR_WIN
    java.nio.file.Path WORKING_DIR -> WORKING_DIR
    java.nio.file.OpenOption[] READ_OPTIONS -> keepErJErRy6HE
    java.nio.file.OpenOption[] WRITE_OPTIONS -> KeePerjeRryt52
    java.nio.file.OpenOption[] APPEND_OPTIONS -> keEPERjERryabM
    java.nio.file.LinkOption[] LINK_OPTIONS -> keepErJErRy6HE
    java.nio.file.CopyOption[] COPY_OPTIONS -> keepErJErRy6HE
    java.util.Set WALK_OPTIONS -> keepErJErRy6HE
    java.util.regex.Pattern CROSS_SEPARATOR_PATTERN -> keepErJErRy6HE
    java.util.regex.Pattern PLATFORM_SEPARATOR_PATTERN -> KeePerjeRryt52
    82:83:void <init>() -> <init>
    90:96:void close(java.lang.AutoCloseable) -> close
    101:103:void copy(java.nio.file.Path,java.nio.file.Path) -> copy
    108:113:void createParentDirs(java.nio.file.Path) -> createParentDirs
    118:118:java.lang.String decode(byte[]) -> decode
    124:124:java.lang.String decodeASCII(byte[]) -> decodeASCII
    130:131:void deleteDir(java.nio.file.Path,boolean) -> deleteDir
    136:136:byte[] encode(java.lang.String) -> encode
    142:142:byte[] encodeASCII(java.lang.String) -> encodeASCII
    148:148:boolean exists(java.nio.file.Path) -> exists
    154:154:java.nio.file.Path getCodeSource(java.lang.Class) -> getCodeSource
    160:160:java.lang.String getFileName(java.nio.file.Path) -> getFileName
    166:166:java.lang.String getIP(java.net.SocketAddress) -> getIP
    172:172:byte[] getResourceBytes(java.lang.String) -> getResourceBytes
    178:183:java.net.URL getResourceURL(java.lang.String) -> getResourceURL
    189:189:boolean hasExtension(java.nio.file.Path,java.lang.String) -> hasExtension
    195:195:boolean isDir(java.nio.file.Path) -> isDir
    201:204:boolean isEmpty(java.nio.file.Path) -> isEmpty
    210:210:boolean isFile(java.nio.file.Path) -> isFile
    216:217:boolean isValidFileName(java.lang.String) -> isValidFileName
    225:230:boolean isValidPath(java.lang.String) -> isValidPath
    237:237:boolean isValidTextureBounds(int,int,boolean) -> isValidTextureBounds
    244:246:void move(java.nio.file.Path,java.nio.file.Path) -> move
    251:251:byte[] newBuffer() -> newBuffer
    257:257:java.io.ByteArrayOutputStream newByteArrayOutput() -> newByteArrayOutput
    263:263:char[] newCharBuffer() -> newCharBuffer
    269:282:java.net.URLConnection newConnection(java.net.URL) -> newConnection
    288:290:java.util.zip.Deflater newDeflater() -> newDeflater
    296:296:java.util.zip.Inflater newInflater() -> newInflater
    302:302:java.io.InputStream newInput(java.net.URL) -> newInput
    308:308:java.io.InputStream newInput(java.nio.file.Path) -> newInput
    314:314:java.io.OutputStream newOutput(java.nio.file.Path) -> newOutput
    320:321:java.io.OutputStream newOutput(java.nio.file.Path,boolean) -> newOutput
    327:327:java.io.BufferedReader newReader(java.io.InputStream) -> newReader
    333:333:java.io.BufferedReader newReader(java.io.InputStream,java.nio.charset.Charset) -> newReader
    339:341:java.io.BufferedReader newReader(java.net.URL) -> newReader
    347:347:java.io.BufferedReader newReader(java.nio.file.Path) -> newReader
    353:355:java.net.Socket newSocket() -> newSocket
    361:361:java.io.BufferedWriter newWriter(java.io.OutputStream) -> newWriter
    367:367:java.io.BufferedWriter newWriter(java.nio.file.Path) -> newWriter
    373:374:java.io.BufferedWriter newWriter(java.nio.file.Path,boolean) -> newWriter
    380:380:java.io.BufferedWriter newWriter(java.io.FileDescriptor) -> newWriter
    386:388:java.util.zip.ZipEntry newZipEntry(java.lang.String) -> newZipEntry
    394:394:java.util.zip.ZipEntry newZipEntry(java.util.zip.ZipEntry) -> newZipEntry
    400:400:java.util.zip.ZipInputStream newZipInput(java.io.InputStream) -> newZipInput
    406:406:java.util.zip.ZipInputStream newZipInput(java.net.URL) -> newZipInput
    412:412:java.util.zip.ZipInputStream newZipInput(java.nio.file.Path) -> newZipInput
    418:432:byte[] read(java.nio.file.Path) -> read
    438:441:byte[] read(java.net.URL) -> read
    447:457:void read(java.io.InputStream,byte[]) -> read
    462:466:byte[] read(java.io.InputStream) -> read
    472:472:java.nio.file.attribute.BasicFileAttributes readAttributes(java.nio.file.Path) -> readAttributes
    478:497:java.awt.image.BufferedImage readTexture(java.lang.Object,boolean) -> readTexture
    503:503:java.lang.String request(java.net.URL) -> request
    509:513:java.net.InetSocketAddress resolve(java.net.InetSocketAddress) -> resolve
    519:535:java.nio.file.Path resolveIncremental(java.nio.file.Path,java.lang.String,java.lang.String) -> resolveIncremental
    543:570:java.nio.file.Path resolveJavaBin(java.nio.file.Path) -> resolveJavaBin
    577:588:void setSocketFlags(java.net.Socket) -> setSocketFlags
    593:593:java.nio.file.Path toPath(java.lang.String) -> toPath
    599:599:java.lang.String toString(java.nio.file.Path) -> toString
    607:611:java.net.URI toURI(java.net.URL) -> toURI
    620:624:java.net.URL toURL(java.nio.file.Path) -> toURL
    631:638:int transfer(java.io.InputStream,java.io.OutputStream) -> transfer
    644:648:void transfer(java.nio.file.Path,java.io.OutputStream) -> transfer
    653:653:int transfer(java.io.InputStream,java.nio.file.Path) -> transfer
    659:662:int transfer(java.io.InputStream,java.nio.file.Path,boolean) -> transfer
    670:674:java.lang.String urlDecode(java.lang.String) -> urlDecode
    683:687:java.lang.String urlEncode(java.lang.String) -> urlEncode
    694:694:java.lang.String verifyFileName(java.lang.String) -> verifyFileName
    700:704:int verifyLength(int,int) -> verifyLength
    710:711:java.awt.image.BufferedImage verifyTexture(java.awt.image.BufferedImage,boolean) -> verifyTexture
    719:724:java.lang.String verifyURL(java.lang.String) -> verifyURL
    733:737:java.net.URL convertToURL(java.lang.String) -> convertToURL
    744:745:void walk(java.nio.file.Path,java.nio.file.FileVisitor,boolean) -> walk
    750:752:void write(java.nio.file.Path,byte[]) -> write
    757:757:java.io.OutputStream newBufferedOutStream(java.io.OutputStream) -> newBufferedOutStream
    763:763:java.io.InputStream newBufferedInputStream(java.io.InputStream) -> newBufferedInputStream
    710:710:boolean lambda$verifyTexture$1(boolean,java.awt.image.BufferedImage) -> keepErJErRy6HE
    217:217:boolean lambda$isValidFileName$0(int) -> keepErJErRy6HE
    29:79:void <clinit>() -> <clinit>
launcher.helper.IOHelper$1 -> launcher.KeepErJerRyaAA:
launcher.helper.IOHelper$DeleteDirVisitor -> launcher.keEPeRjerry0z3:
    java.nio.file.Path dir -> keepErJErRy6HE
    boolean self -> keepErJErRy6HE
    772:775:void <init>(java.nio.file.Path,boolean) -> <init>
    780:785:java.nio.file.FileVisitResult postVisitDirectory(java.nio.file.Path,java.io.IOException) -> keepErJErRy6HE
    791:792:java.nio.file.FileVisitResult visitFile(java.nio.file.Path,java.nio.file.attribute.BasicFileAttributes) -> keepErJErRy6HE
    766:766:java.nio.file.FileVisitResult postVisitDirectory(java.lang.Object,java.io.IOException) -> postVisitDirectory
    766:766:java.nio.file.FileVisitResult visitFile(java.lang.Object,java.nio.file.attribute.BasicFileAttributes) -> visitFile
    766:766:void <init>(java.nio.file.Path,boolean,launcher.helper.IOHelper$1) -> <init>
launcher.helper.IOHelper$SkipHiddenVisitor -> launcher.kEEPerJERrygyq:
    java.nio.file.FileVisitor visitor -> keepErJErRy6HE
    801:803:void <init>(java.nio.file.FileVisitor) -> <init>
    808:808:java.nio.file.FileVisitResult postVisitDirectory(java.nio.file.Path,java.io.IOException) -> keepErJErRy6HE
    814:814:java.nio.file.FileVisitResult preVisitDirectory(java.nio.file.Path,java.nio.file.attribute.BasicFileAttributes) -> keepErJErRy6HE
    820:820:java.nio.file.FileVisitResult visitFile(java.nio.file.Path,java.nio.file.attribute.BasicFileAttributes) -> KeePerjeRryt52
    826:826:java.nio.file.FileVisitResult visitFileFailed(java.nio.file.Path,java.io.IOException) -> KeePerjeRryt52
    796:796:java.nio.file.FileVisitResult postVisitDirectory(java.lang.Object,java.io.IOException) -> postVisitDirectory
    796:796:java.nio.file.FileVisitResult visitFileFailed(java.lang.Object,java.io.IOException) -> visitFileFailed
    796:796:java.nio.file.FileVisitResult visitFile(java.lang.Object,java.nio.file.attribute.BasicFileAttributes) -> visitFile
    796:796:java.nio.file.FileVisitResult preVisitDirectory(java.lang.Object,java.nio.file.attribute.BasicFileAttributes) -> preVisitDirectory
    796:796:void <init>(java.nio.file.FileVisitor,launcher.helper.IOHelper$1) -> <init>
launcher.helper.JVMHelper -> launcher.keeperjERRyWCz:
    java.lang.management.RuntimeMXBean RUNTIME_MXBEAN -> RUNTIME_MXBEAN
    com.sun.management.OperatingSystemMXBean OPERATING_SYSTEM_MXBEAN -> OPERATING_SYSTEM_MXBEAN
    launcher.helper.JVMHelper$OS OS_TYPE -> OS_TYPE
    java.lang.String OS_VERSION -> OS_VERSION
    int OS_BITS -> OS_BITS
    int JVM_BITS -> JVM_BITS
    int RAM -> RAM
    sun.misc.Unsafe UNSAFE -> UNSAFE
    java.lang.invoke.MethodHandles$Lookup LOOKUP -> LOOKUP
    java.lang.Runtime RUNTIME -> RUNTIME
    java.lang.ClassLoader LOADER -> LOADER
    java.lang.String JAVA_LIBRARY_PATH -> keepErJErRy6HE
    java.lang.Object UCP -> keepErJErRy6HE
    java.lang.invoke.MethodHandle MH_UCP_ADDURL_METHOD -> keepErJErRy6HE
    java.lang.invoke.MethodHandle MH_UCP_GETURLS_METHOD -> KeePerjeRryt52
    java.lang.invoke.MethodHandle MH_UCP_GETRESOURCE_METHOD -> keEPERjERryabM
    java.lang.invoke.MethodHandle MH_RESOURCE_GETCERTS_METHOD -> keEpErjeRRYsAK
    90:91:void <init>() -> <init>
    98:104:void addClassPath(java.net.URL) -> addClassPath
    110:113:void fullGC() -> fullGC
    120:125:java.security.cert.Certificate[] getCertificates(java.lang.String) -> getCertificates
    134:138:java.net.URL[] getClassPath() -> getClassPath
    145:154:void halt0(int) -> halt0
    159:159:boolean isJVMMatchesSystemArch() -> isJVMMatchesSystemArch
    165:181:void verifySystemProperties(java.lang.Class,boolean) -> verifySystemProperties
    187:193:int getCorrectOSArch() -> keepErJErRy6HE
    198:199:int getRAMAmount() -> KeePerjeRryt52
    204:215:java.lang.Class firstClass(java.lang.String[]) -> keepErJErRy6HE
    23:87:void <clinit>() -> <clinit>
launcher.helper.JVMHelper$OS -> launcher.keePeRJERRyHjo:
    launcher.helper.JVMHelper$OS MUSTDIE -> MUSTDIE
    launcher.helper.JVMHelper$OS LINUX -> LINUX
    launcher.helper.JVMHelper$OS MACOSX -> MACOSX
    java.lang.String name -> name
    launcher.helper.JVMHelper$OS[] $VALUES -> $VALUES
    218:218:launcher.helper.JVMHelper$OS[] values() -> values
    218:218:launcher.helper.JVMHelper$OS valueOf(java.lang.String) -> valueOf
    225:227:void <init>(java.lang.String,int,java.lang.String) -> <init>
    231:247:launcher.helper.JVMHelper$OS byName(java.lang.String) -> byName
    218:221:void <clinit>() -> <clinit>
launcher.helper.LogHelper -> launcher.KeepERjeRRyN4e:
    java.lang.String DEBUG_PROPERTY -> DEBUG_PROPERTY
    java.lang.String NO_JANSI_PROPERTY -> NO_JANSI_PROPERTY
    boolean JANSI -> JANSI
    java.time.format.DateTimeFormatter DATE_TIME_FORMATTER -> keepErJErRy6HE
    java.util.concurrent.atomic.AtomicBoolean DEBUG_ENABLED -> keepErJErRy6HE
    java.util.Set OUTPUTS -> keepErJErRy6HE
    launcher.helper.LogHelper$Output STD_OUTPUT -> keepErJErRy6HE
    80:81:void <init>() -> <init>
    86:87:void addOutput(launcher.helper.LogHelper$Output) -> addOutput
    92:100:void addOutput(java.nio.file.Path) -> addOutput
    105:106:void addOutput(java.io.Writer) -> addOutput
    111:115:void debug(java.lang.String) -> debug
    120:121:void debug(java.lang.String,java.lang.Object[]) -> debug
    126:127:void error(java.lang.Throwable) -> error
    132:133:void error(java.lang.String) -> error
    138:139:void error(java.lang.String,java.lang.Object[]) -> error
    144:145:void info(java.lang.String) -> info
    150:151:void info(java.lang.String,java.lang.Object[]) -> info
    156:156:boolean isDebugEnabled() -> isDebugEnabled
    162:163:void setDebugEnabled(boolean) -> setDebugEnabled
    168:171:void log(launcher.helper.LogHelper$Level,java.lang.String,boolean) -> log
    176:177:void printVersion(java.lang.String) -> printVersion
    182:186:void println(java.lang.String) -> println
    191:191:boolean removeOutput(launcher.helper.LogHelper$Output) -> removeOutput
    197:197:boolean removeStdOutput() -> removeStdOutput
    203:207:void subDebug(java.lang.String) -> subDebug
    212:213:void subDebug(java.lang.String,java.lang.Object[]) -> subDebug
    218:219:void subInfo(java.lang.String) -> subInfo
    224:225:void subInfo(java.lang.String,java.lang.Object[]) -> subInfo
    230:231:void subWarning(java.lang.String) -> subWarning
    236:237:void subWarning(java.lang.String,java.lang.Object[]) -> subWarning
    242:252:java.lang.String toString(java.lang.Throwable) -> toString
    259:260:void warning(java.lang.String) -> warning
    265:266:void warning(java.lang.String,java.lang.Object[]) -> warning
    271:317:java.lang.String ansiFormatLog(launcher.helper.LogHelper$Level,java.lang.String,java.lang.String,boolean) -> keepErJErRy6HE
    322:327:java.lang.String ansiFormatVersion(java.lang.String) -> keepErJErRy6HE
    332:336:java.lang.String formatLog(launcher.helper.LogHelper$Level,java.lang.String,java.lang.String,boolean) -> KeePerjeRryt52
    341:341:java.lang.String formatVersion(java.lang.String) -> KeePerjeRryt52
    32:77:void <clinit>() -> <clinit>
launcher.helper.LogHelper$1 -> launcher.KEepErjeRrYEkB:
    int[] $SwitchMap$launcher$helper$LogHelper$Level -> keepErJErRy6HE
    272:272:void <clinit>() -> <clinit>
launcher.helper.LogHelper$JAnsiOutput -> launcher.keEpeRJerRYfkE:
    373:374:void <init>(java.io.OutputStream) -> <init>
    369:369:void <init>(java.io.OutputStream,launcher.helper.LogHelper$1) -> <init>
launcher.helper.LogHelper$Level -> launcher.KeePErjerRyOyX:
    launcher.helper.LogHelper$Level DEBUG -> DEBUG
    launcher.helper.LogHelper$Level INFO -> INFO
    launcher.helper.LogHelper$Level WARNING -> WARNING
    launcher.helper.LogHelper$Level ERROR -> ERROR
    java.lang.String name -> name
    launcher.helper.LogHelper$Level[] $VALUES -> $VALUES
    344:344:launcher.helper.LogHelper$Level[] values() -> values
    344:344:launcher.helper.LogHelper$Level valueOf(java.lang.String) -> valueOf
    351:353:void <init>(java.lang.String,int,java.lang.String) -> <init>
    358:358:java.lang.String toString() -> toString
    344:347:void <clinit>() -> <clinit>
launcher.helper.LogHelper$Output -> launcher.KeEPerjerRYDVT:
    void println(java.lang.String) -> println
launcher.helper.LogHelper$WriterOutput -> launcher.kEEPeRJerRYVb1:
    java.io.Writer writer -> keepErJErRy6HE
    382:384:void <init>(java.io.Writer) -> <init>
    389:390:void close() -> close
    397:404:void println(java.lang.String) -> println
    377:377:void <init>(java.io.Writer,launcher.helper.LogHelper$1) -> <init>
launcher.helper.SecurityHelper -> launcher.keepERJerRyy82:
    java.lang.String RSA_ALGO -> RSA_ALGO
    java.lang.String RSA_SIGN_ALGO -> RSA_SIGN_ALGO
    java.lang.String RSA_CIPHER_ALGO -> RSA_CIPHER_ALGO
    int TOKEN_LENGTH -> TOKEN_LENGTH
    int RSA_KEY_LENGTH_BITS -> RSA_KEY_LENGTH_BITS
    int RSA_KEY_LENGTH -> RSA_KEY_LENGTH
    int CRYPTO_MAX_LENGTH -> CRYPTO_MAX_LENGTH
    java.lang.String CERTIFICATE_DIGEST -> CERTIFICATE_DIGEST
    java.lang.String HEX -> HEX
    java.lang.String JWT -> JWT
    char[] VOWELS -> keepErJErRy6HE
    char[] CONS -> KeePerjeRryt52
    60:61:void <init>() -> <init>
    66:66:byte[] digest(launcher.helper.SecurityHelper$DigestAlgorithm,java.lang.String) -> digest
    72:75:byte[] digest(launcher.helper.SecurityHelper$DigestAlgorithm,java.net.URL) -> digest
    81:84:byte[] digest(launcher.helper.SecurityHelper$DigestAlgorithm,java.nio.file.Path) -> digest
    90:90:byte[] digest(launcher.helper.SecurityHelper$DigestAlgorithm,byte[]) -> digest
    96:102:byte[] digest(launcher.helper.SecurityHelper$DigestAlgorithm,java.io.InputStream) -> digest
    110:116:java.security.KeyPair genRSAKeyPair(java.security.SecureRandom) -> genRSAKeyPair
    123:123:java.security.KeyPair genRSAKeyPair() -> genRSAKeyPair
    131:135:boolean isValidCertificate(java.security.cert.Certificate) -> isValidCertificate
    142:142:boolean isValidCertificates(java.security.cert.Certificate[]) -> isValidCertificates
    149:157:boolean isValidCertificates(java.lang.Class) -> isValidCertificates
    163:166:boolean isValidSign(java.nio.file.Path,byte[],java.security.interfaces.RSAPublicKey) -> isValidSign
    172:181:boolean isValidSign(byte[],byte[],java.security.interfaces.RSAPublicKey) -> isValidSign
    187:189:boolean isValidSign(java.io.InputStream,byte[],java.security.interfaces.RSAPublicKey) -> isValidSign
    195:198:boolean isValidSign(java.net.URL,byte[],java.security.interfaces.RSAPublicKey) -> isValidSign
    206:206:boolean isValidToken(java.lang.CharSequence) -> isValidToken
    212:219:java.security.MessageDigest newDigest(launcher.helper.SecurityHelper$DigestAlgorithm) -> newDigest
    226:226:javax.crypto.Cipher newRSADecryptCipher(java.security.interfaces.RSAPrivateKey) -> newRSADecryptCipher
    232:232:javax.crypto.Cipher newRSAEncryptCipher(java.security.interfaces.RSAPublicKey) -> newRSAEncryptCipher
    238:247:java.security.Signature newRSASignSignature(java.security.interfaces.RSAPrivateKey) -> newRSASignSignature
    253:262:java.security.Signature newRSAVerifySignature(java.security.interfaces.RSAPublicKey) -> newRSAVerifySignature
    268:268:java.security.SecureRandom newRandom() -> newRandom
    274:276:byte[] randomBytes(java.util.Random,int) -> randomBytes
    282:282:byte[] randomBytes(int) -> randomBytes
    288:288:java.lang.String randomStringToken(java.util.Random) -> randomStringToken
    294:294:java.lang.String randomStringToken() -> randomStringToken
    300:300:byte[] randomToken(java.util.Random) -> randomToken
    306:306:byte[] randomToken() -> randomToken
    312:385:java.lang.String randomUsername(java.util.Random) -> randomUsername
    391:391:java.lang.String randomUsername() -> randomUsername
    397:405:byte[] sign(java.io.InputStream,java.security.interfaces.RSAPrivateKey) -> sign
    412:420:byte[] sign(byte[],java.security.interfaces.RSAPrivateKey) -> sign
    427:430:byte[] sign(java.nio.file.Path,java.security.interfaces.RSAPrivateKey) -> sign
    436:446:java.lang.String toHex(byte[]) -> toHex
    452:452:java.security.interfaces.RSAPrivateKey toPrivateRSAKey(byte[]) -> toPrivateRSAKey
    458:458:java.security.interfaces.RSAPublicKey toPublicRSAKey(byte[]) -> toPublicRSAKey
    464:468:void verifyCertificates(java.lang.Class) -> verifyCertificates
    473:477:void verifySign(byte[],byte[],java.security.interfaces.RSAPublicKey) -> verifySign
    482:486:void verifySign(java.io.InputStream,byte[],java.security.interfaces.RSAPublicKey) -> verifySign
    491:495:void verifySign(java.nio.file.Path,byte[],java.security.interfaces.RSAPublicKey) -> verifySign
    500:504:void verifySign(java.net.URL,byte[],java.security.interfaces.RSAPublicKey) -> verifySign
    509:509:java.lang.String verifyToken(java.lang.String) -> verifyToken
    517:525:javax.crypto.Cipher newCipher(java.lang.String) -> keepErJErRy6HE
    531:540:javax.crypto.Cipher newRSACipher(int,java.security.interfaces.RSAKey) -> keepErJErRy6HE
    547:551:java.security.KeyFactory newRSAKeyFactory() -> keepErJErRy6HE
    559:563:java.security.Signature newRSASignature() -> keepErJErRy6HE
    569:581:void updateSignature(java.io.InputStream,java.security.Signature) -> keepErJErRy6HE
    212:212:boolean lambda$newDigest$1(launcher.helper.SecurityHelper$DigestAlgorithm) -> keepErJErRy6HE
    206:206:boolean lambda$isValidToken$0(int) -> keepErJErRy6HE
    56:57:void <clinit>() -> <clinit>
launcher.helper.SecurityHelper$DigestAlgorithm -> launcher.KeePErJERrYQ1W:
    launcher.helper.SecurityHelper$DigestAlgorithm PLAIN -> PLAIN
    launcher.helper.SecurityHelper$DigestAlgorithm MD5 -> MD5
    launcher.helper.SecurityHelper$DigestAlgorithm SHA1 -> SHA1
    launcher.helper.SecurityHelper$DigestAlgorithm SHA224 -> SHA224
    launcher.helper.SecurityHelper$DigestAlgorithm SHA256 -> SHA256
    launcher.helper.SecurityHelper$DigestAlgorithm SHA512 -> SHA512
    java.util.Map ALGORITHMS -> ALGORITHMS
    java.lang.String name -> name
    int bits -> bits
    int bytes -> bytes
    launcher.helper.SecurityHelper$DigestAlgorithm[] $VALUES -> $VALUES
    boolean $assertionsDisabled -> $assertionsDisabled
    583:583:launcher.helper.SecurityHelper$DigestAlgorithm[] values() -> values
    583:583:launcher.helper.SecurityHelper$DigestAlgorithm valueOf(java.lang.String) -> valueOf
    605:612:void <init>(java.lang.String,int,java.lang.String,int) -> <init>
    616:616:launcher.helper.SecurityHelper$DigestAlgorithm byName(java.lang.String) -> byName
    622:622:java.lang.String toString() -> toString
    627:631:byte[] verify(byte[]) -> verify
    583:597:void <clinit>() -> <clinit>
launcher.helper.VerifyHelper -> launcher.KeepeRJERRyWud:
    java.util.function.IntPredicate POSITIVE -> POSITIVE
    java.util.function.IntPredicate NOT_NEGATIVE -> NOT_NEGATIVE
    java.util.function.LongPredicate L_POSITIVE -> L_POSITIVE
    java.util.function.LongPredicate L_NOT_NEGATIVE -> L_NOT_NEGATIVE
    java.util.function.Predicate NOT_EMPTY -> NOT_EMPTY
    java.util.regex.Pattern USERNAME_PATTERN -> USERNAME_PATTERN
    29:30:void <init>() -> <init>
    35:35:java.lang.Object getMapValue(java.util.Map,java.lang.Object,java.lang.String) -> getMapValue
    41:41:boolean isValidIDName(java.lang.String) -> isValidIDName
    47:47:boolean isValidIDNameChar(int) -> isValidIDNameChar
    53:53:boolean isValidUsername(java.lang.CharSequence) -> isValidUsername
    59:60:void putIfAbsent(java.util.Map,java.lang.Object,java.lang.Object,java.lang.String) -> putIfAbsent
    65:65:java.util.function.IntPredicate range(int,int) -> range
    71:75:java.lang.Object verify(java.lang.Object,java.util.function.Predicate,java.lang.String) -> verify
    81:85:double verifyDouble(double,java.util.function.DoublePredicate,java.lang.String) -> verifyDouble
    91:91:java.lang.String verifyIDName(java.lang.String) -> verifyIDName
    97:101:int verifyInt(int,java.util.function.IntPredicate,java.lang.String) -> verifyInt
    107:111:long verifyLong(long,java.util.function.LongPredicate,java.lang.String) -> verifyLong
    117:117:java.lang.String verifyUsername(java.lang.String) -> verifyUsername
    65:65:boolean lambda$range$5(int,int,int) -> keepErJErRy6HE
    24:24:boolean lambda$static$4(java.lang.String) -> keepErJErRy6HE
    22:22:boolean lambda$static$3(long) -> keepErJErRy6HE
    20:20:boolean lambda$static$2(long) -> KeePerjeRryt52
    18:18:boolean lambda$static$1(int) -> keepErJErRy6HE
    16:16:boolean lambda$static$0(int) -> KeePerjeRryt52
    16:26:void <clinit>() -> <clinit>
launcher.helper.js.JSApplication -> launcher.kEepeRjerry9Ep:
    java.util.concurrent.atomic.AtomicReference INSTANCE -> INSTANCE
    16:18:void <init>() -> <init>
    22:22:launcher.helper.js.JSApplication getInstance() -> getInstance
    12:12:void <clinit>() -> <clinit>
launcher.request.CustomRequest -> launcher.KeepErJErrYUKW:
    14:15:void <init>(launcher.Launcher$Config) -> <init>
    20:21:void <init>() -> <init>
    26:26:launcher.request.Request$Type getType() -> getType
    32:36:java.lang.Object requestDo(launcher.serialize.HInput,launcher.serialize.HOutput) -> requestDo
    java.lang.String getName() -> getName
    java.lang.Object requestDoCustom(launcher.serialize.HInput,launcher.serialize.HOutput) -> requestDoCustom
launcher.request.PingRequest -> launcher.kEEperJErryB31:
    byte EXPECTED_BYTE -> EXPECTED_BYTE
    18:19:void <init>(launcher.Launcher$Config) -> <init>
    24:25:void <init>() -> <init>
    30:30:launcher.request.Request$Type getType() -> getType
    36:41:java.lang.Void requestDo(launcher.serialize.HInput,launcher.serialize.HOutput) -> keepErJErRy6HE
    10:10:java.lang.Object requestDo(launcher.serialize.HInput,launcher.serialize.HOutput) -> requestDo
launcher.request.Request -> launcher.KeePeRjerryDH3:
    launcher.Launcher$Config config -> config
    java.util.concurrent.atomic.AtomicBoolean started -> keepErJErRy6HE
    21:27:void <init>(launcher.Launcher$Config) -> <init>
    32:33:void <init>() -> <init>
    38:38:void requestError(java.lang.String) -> requestError
    launcher.request.Request$Type getType() -> getType
    java.lang.Object requestDo(launcher.serialize.HInput,launcher.serialize.HOutput) -> requestDo
    51:66:java.lang.Object request() -> request
    72:77:void readError(launcher.serialize.HInput) -> readError
    82:92:void writeHandshake(launcher.serialize.HInput,launcher.serialize.HOutput) -> keepErJErRy6HE
launcher.request.Request$Type -> launcher.kEePeRJeRryAUj:
    launcher.request.Request$Type PING -> PING
    launcher.request.Request$Type LAUNCHER -> LAUNCHER
    launcher.request.Request$Type UPDATE -> UPDATE
    launcher.request.Request$Type UPDATE_LIST -> UPDATE_LIST
    launcher.request.Request$Type AUTH -> AUTH
    launcher.request.Request$Type JOIN_SERVER -> JOIN_SERVER
    launcher.request.Request$Type CHECK_SERVER -> CHECK_SERVER
    launcher.request.Request$Type PROFILE_BY_USERNAME -> PROFILE_BY_USERNAME
    launcher.request.Request$Type PROFILE_BY_UUID -> PROFILE_BY_UUID
    launcher.request.Request$Type BATCH_PROFILE_BY_USERNAME -> BATCH_PROFILE_BY_USERNAME
    launcher.request.Request$Type CUSTOM -> CUSTOM
    launcher.serialize.stream.EnumSerializer SERIALIZER -> SERIALIZER
    int n -> n
    launcher.request.Request$Type[] $VALUES -> $VALUES
    94:94:launcher.request.Request$Type[] values() -> values
    94:94:launcher.request.Request$Type valueOf(java.lang.String) -> valueOf
    106:108:void <init>(java.lang.String,int,int) -> <init>
    113:113:launcher.request.Request$Type read(launcher.serialize.HInput) -> read
    119:119:int getNumber() -> getNumber
    94:102:void <clinit>() -> <clinit>
launcher.request.RequestException -> launcher.keePeRJERrYZU2:
    long serialVersionUID -> keepErJErRy6HE
    14:15:void <init>(java.lang.String) -> <init>
    20:21:void <init>(java.lang.Throwable) -> <init>
    26:27:void <init>(java.lang.String,java.lang.Throwable) -> <init>
    32:32:java.lang.String toString() -> toString
launcher.request.auth.AuthRequest -> launcher.kEEpErjERrYCqu:
    java.lang.String login -> keepErJErRy6HE
    byte[] encryptedPassword -> keepErJErRy6HE
    23:26:void <init>(launcher.Launcher$Config,java.lang.String,byte[]) -> <init>
    31:32:void <init>(java.lang.String,byte[]) -> <init>
    37:37:launcher.request.Request$Type getType() -> getType
    43:52:launcher.request.auth.AuthRequest$Result requestDo(launcher.serialize.HInput,launcher.serialize.HOutput) -> keepErJErRy6HE
    15:15:java.lang.Object requestDo(launcher.serialize.HInput,launcher.serialize.HOutput) -> requestDo
launcher.request.auth.AuthRequest$1 -> launcher.KEEpeRjerRyhZa:
launcher.request.auth.AuthRequest$Result -> launcher.KEEPerJeRrYDn8:
    launcher.client.PlayerProfile pp -> pp
    java.lang.String accessToken -> accessToken
    63:66:void <init>(launcher.client.PlayerProfile,java.lang.String) -> <init>
    55:55:void <init>(launcher.client.PlayerProfile,java.lang.String,launcher.request.auth.AuthRequest$1) -> <init>
launcher.request.auth.CheckServerRequest -> launcher.KeEPERjerRyo6P:
    java.lang.String username -> keepErJErRy6HE
    java.lang.String serverID -> KeePerjeRryt52
    21:24:void <init>(launcher.Launcher$Config,java.lang.String,java.lang.String) -> <init>
    29:30:void <init>(java.lang.String,java.lang.String) -> <init>
    35:35:launcher.request.Request$Type getType() -> getType
    41:47:launcher.client.PlayerProfile requestDo(launcher.serialize.HInput,launcher.serialize.HOutput) -> keepErJErRy6HE
    13:13:java.lang.Object requestDo(launcher.serialize.HInput,launcher.serialize.HOutput) -> requestDo
launcher.request.auth.JoinServerRequest -> launcher.KEEperJerRyucK:
    java.util.regex.Pattern SERVERID_PATTERN -> keepErJErRy6HE
    java.lang.String username -> keepErJErRy6HE
    java.lang.String accessToken -> KeePerjeRryt52
    java.lang.String serverID -> keEPERjERryabM
    26:30:void <init>(launcher.Launcher$Config,java.lang.String,java.lang.String,java.lang.String) -> <init>
    35:36:void <init>(java.lang.String,java.lang.String,java.lang.String) -> <init>
    41:41:boolean isValidServerID(java.lang.CharSequence) -> isValidServerID
    47:48:java.lang.String verifyServerID(java.lang.String) -> verifyServerID
    54:54:launcher.request.Request$Type getType() -> getType
    60:68:java.lang.Boolean requestDo(launcher.serialize.HInput,launcher.serialize.HOutput) -> keepErJErRy6HE
    14:14:java.lang.Object requestDo(launcher.serialize.HInput,launcher.serialize.HOutput) -> requestDo
    16:16:void <clinit>() -> <clinit>
launcher.request.update.LauncherRequest -> launcher.KEepeRjeRRY7ep:
    java.nio.file.Path BINARY_PATH -> BINARY_PATH
    boolean EXE_BINARY -> EXE_BINARY
    36:37:void <init>(launcher.Launcher$Config) -> <init>
    42:43:void <init>() -> <init>
    48:72:void update(launcher.Launcher$Config,launcher.request.update.LauncherRequest$Result) -> update
    78:78:launcher.request.Request$Type getType() -> getType
    85:113:launcher.request.update.LauncherRequest$Result requestDo(launcher.serialize.HInput,launcher.serialize.HOutput) -> keepErJErRy6HE
    26:26:java.lang.Object requestDo(launcher.serialize.HInput,launcher.serialize.HOutput) -> requestDo
    29:31:void <clinit>() -> <clinit>
launcher.request.update.LauncherRequest$1 -> launcher.KeepeRJERRyjXj:
launcher.request.update.LauncherRequest$Result -> launcher.kEEperjeRryvyX:
    java.util.List profiles -> profiles
    byte[] binary -> keepErJErRy6HE
    byte[] sign -> KeePerjeRryt52
    124:128:void <init>(byte[],byte[],java.util.List) -> <init>
    133:133:byte[] getBinary() -> getBinary
    139:139:byte[] getSign() -> getSign
    116:116:byte[] access$000(launcher.request.update.LauncherRequest$Result) -> keepErJErRy6HE
    116:116:byte[] access$100(launcher.request.update.LauncherRequest$Result) -> KeePerjeRryt52
    116:116:void <init>(byte[],byte[],java.util.List,launcher.request.update.LauncherRequest$1) -> <init>
launcher.request.update.UpdateListRequest -> launcher.kEePerJERRYGZu:
    20:21:void <init>(launcher.Launcher$Config) -> <init>
    26:27:void <init>() -> <init>
    32:32:launcher.request.Request$Type getType() -> getType
    38:48:java.util.Set requestDo(launcher.serialize.HInput,launcher.serialize.HOutput) -> keepErJErRy6HE
    15:15:java.lang.Object requestDo(launcher.serialize.HInput,launcher.serialize.HOutput) -> requestDo
launcher.request.update.UpdateRequest -> launcher.kEeperjerRYUNg:
    int MAX_QUEUE_SIZE -> MAX_QUEUE_SIZE
    java.lang.String dirName -> keepErJErRy6HE
    java.nio.file.Path dir -> keepErJErRy6HE
    launcher.hasher.FileNameMatcher matcher -> keepErJErRy6HE
    boolean digest -> keepErJErRy6HE
    launcher.request.update.UpdateRequest$State$Callback stateCallback -> keepErJErRy6HE
    launcher.hasher.HashedDir localDir -> keepErJErRy6HE
    long totalDownloaded -> keepErJErRy6HE
    long totalSize -> KeePerjeRryt52
    java.time.Instant startTime -> keepErJErRy6HE
    59:64:void <init>(launcher.Launcher$Config,java.lang.String,java.nio.file.Path,launcher.hasher.FileNameMatcher,boolean) -> <init>
    69:70:void <init>(java.lang.String,java.nio.file.Path,launcher.hasher.FileNameMatcher,boolean) -> <init>
    74:93:void fillActionsQueue(java.util.Queue,launcher.hasher.HashedDir) -> keepErJErRy6HE
    98:98:launcher.request.Request$Type getType() -> getType
    104:108:launcher.serialize.signed.SignedObjectHolder request() -> keepErJErRy6HE
    115:183:launcher.serialize.signed.SignedObjectHolder requestDo(launcher.serialize.HInput,launcher.serialize.HOutput) -> keepErJErRy6HE
    189:190:void setStateCallback(launcher.request.update.UpdateRequest$State$Callback) -> setStateCallback
    194:222:void deleteExtraDir(java.nio.file.Path,launcher.hasher.HashedDir,boolean) -> keepErJErRy6HE
    226:270:void downloadFile(java.nio.file.Path,launcher.hasher.HashedFile,java.io.InputStream) -> keepErJErRy6HE
    274:279:void updateState(java.lang.String,long,long) -> keepErJErRy6HE
    38:38:java.lang.Object request() -> request
    38:38:java.lang.Object requestDo(launcher.serialize.HInput,launcher.serialize.HOutput) -> requestDo
launcher.request.update.UpdateRequest$1 -> launcher.KeePeRJerryuZn:
    int[] $SwitchMap$launcher$hasher$HashedEntry$Type -> keepErJErRy6HE
    int[] $SwitchMap$launcher$request$update$UpdateRequest$Action$Type -> KeePerjeRryt52
    79:156:void <clinit>() -> <clinit>
launcher.request.update.UpdateRequest$Action -> launcher.kEePeRJeRRyds6:
    launcher.request.update.UpdateRequest$Action CD_BACK -> keepErJErRy6HE
    launcher.request.update.UpdateRequest$Action FINISH -> KeePerjeRryt52
    launcher.request.update.UpdateRequest$Action$Type type -> keepErJErRy6HE
    java.lang.String name -> keepErJErRy6HE
    launcher.hasher.HashedEntry entry -> keepErJErRy6HE
    292:296:void <init>(launcher.request.update.UpdateRequest$Action$Type,java.lang.String,launcher.hasher.HashedEntry) -> <init>
    299:303:void <init>(launcher.serialize.HInput) -> <init>
    308:313:void write(launcher.serialize.HOutput) -> write
    283:284:void <clinit>() -> <clinit>
launcher.request.update.UpdateRequest$Action$Type -> launcher.KEePerJerrYhCt:
    launcher.request.update.UpdateRequest$Action$Type CD -> keepErJErRy6HE
    launcher.request.update.UpdateRequest$Action$Type CD_BACK -> KeePerjeRryt52
    launcher.request.update.UpdateRequest$Action$Type GET -> keEPERjERryabM
    launcher.request.update.UpdateRequest$Action$Type FINISH -> keEpErjeRRYsAK
    launcher.serialize.stream.EnumSerializer SERIALIZER -> keepErJErRy6HE
    int n -> keepErJErRy6HE
    launcher.request.update.UpdateRequest$Action$Type[] $VALUES -> keepErJErRy6HE
    315:315:launcher.request.update.UpdateRequest$Action$Type[] values() -> values
    315:315:launcher.request.update.UpdateRequest$Action$Type valueOf(java.lang.String) -> valueOf
    322:324:void <init>(java.lang.String,int,int) -> <init>
    328:328:launcher.request.update.UpdateRequest$Action$Type read(launcher.serialize.HInput) -> keepErJErRy6HE
    334:334:int getNumber() -> getNumber
    315:318:void <clinit>() -> <clinit>
launcher.request.update.UpdateRequest$State -> launcher.KeePERjeRRywbr:
    long fileDownloaded -> fileDownloaded
    long fileSize -> fileSize
    long totalDownloaded -> totalDownloaded
    long totalSize -> totalSize
    java.lang.String filePath -> filePath
    java.time.Duration duration -> duration
    355:364:void <init>(java.lang.String,long,long,long,long,java.time.Duration) -> <init>
    369:374:double getBps() -> getBps
    380:385:java.time.Duration getEstimatedTime() -> getEstimatedTime
    391:391:double getFileDownloadedKiB() -> getFileDownloadedKiB
    397:397:double getFileDownloadedMiB() -> getFileDownloadedMiB
    403:407:double getFileDownloadedPart() -> getFileDownloadedPart
    413:413:long getFileRemaining() -> getFileRemaining
    419:419:double getFileRemainingKiB() -> getFileRemainingKiB
    425:425:double getFileRemainingMiB() -> getFileRemainingMiB
    431:431:double getFileSizeKiB() -> getFileSizeKiB
    437:437:double getFileSizeMiB() -> getFileSizeMiB
    443:443:double getTotalDownloadedKiB() -> getTotalDownloadedKiB
    449:449:double getTotalDownloadedMiB() -> getTotalDownloadedMiB
    455:459:double getTotalDownloadedPart() -> getTotalDownloadedPart
    465:465:long getTotalRemaining() -> getTotalRemaining
    471:471:double getTotalRemainingKiB() -> getTotalRemainingKiB
    477:477:double getTotalRemainingMiB() -> getTotalRemainingMiB
    483:483:double getTotalSizeKiB() -> getTotalSizeKiB
    489:489:double getTotalSizeMiB() -> getTotalSizeMiB
launcher.request.update.UpdateRequest$State$Callback -> launcher.kEepERjerRYZFo:
    void call(launcher.request.update.UpdateRequest$State) -> keepErJErRy6HE
launcher.request.uuid.BatchProfileByUsernameRequest -> launcher.KeePerJErRy8Tm:
    int MAX_BATCH_SIZE -> MAX_BATCH_SIZE
    java.lang.String[] usernames -> keepErJErRy6HE
    23:30:void <init>(launcher.Launcher$Config,java.lang.String[]) -> <init>
    35:36:void <init>(java.lang.String[]) -> <init>
    41:41:launcher.request.Request$Type getType() -> getType
    47:62:launcher.client.PlayerProfile[] requestDo(launcher.serialize.HInput,launcher.serialize.HOutput) -> keepErJErRy6HE
    14:14:java.lang.Object requestDo(launcher.serialize.HInput,launcher.serialize.HOutput) -> requestDo
launcher.request.uuid.ProfileByUUIDRequest -> launcher.KEEPeRJERrYASS:
    java.util.UUID uuid -> keepErJErRy6HE
    21:23:void <init>(launcher.Launcher$Config,java.util.UUID) -> <init>
    28:29:void <init>(java.util.UUID) -> <init>
    34:34:launcher.request.Request$Type getType() -> getType
    40:44:launcher.client.PlayerProfile requestDo(launcher.serialize.HInput,launcher.serialize.HOutput) -> keepErJErRy6HE
    14:14:java.lang.Object requestDo(launcher.serialize.HInput,launcher.serialize.HOutput) -> requestDo
launcher.request.uuid.ProfileByUsernameRequest -> launcher.KeePeRJErRyHXN:
    java.lang.String username -> keepErJErRy6HE
    20:22:void <init>(launcher.Launcher$Config,java.lang.String) -> <init>
    27:28:void <init>(java.lang.String) -> <init>
    33:33:launcher.request.Request$Type getType() -> getType
    39:43:launcher.client.PlayerProfile requestDo(launcher.serialize.HInput,launcher.serialize.HOutput) -> keepErJErRy6HE
    13:13:java.lang.Object requestDo(launcher.serialize.HInput,launcher.serialize.HOutput) -> requestDo
launcher.serialize.HInput -> launcher.KEePerjeRry8VJ:
    java.io.InputStream stream -> stream
    21:23:void <init>(java.io.InputStream) -> <init>
    27:29:void <init>(byte[]) -> <init>
    34:35:void close() -> close
    40:40:java.lang.String readASCII(int) -> readASCII
    46:46:java.math.BigInteger readBigInteger(int) -> readBigInteger
    52:60:boolean readBoolean() -> readBoolean
    67:69:byte[] readByteArray(int) -> readByteArray
    75:75:int readInt() -> readInt
    81:85:int readLength(int) -> readLength
    91:91:long readLong() -> readLong
    97:97:short readShort() -> readShort
    103:103:java.lang.String readString(int) -> readString
    109:109:java.util.UUID readUUID() -> readUUID
    115:120:int readUnsignedByte() -> readUnsignedByte
    126:126:int readUnsignedShort() -> readUnsignedShort
    132:144:int readVarInt() -> readVarInt
    150:162:long readVarLong() -> readVarLong
launcher.serialize.HOutput -> launcher.KEeperjERRYyzU:
    java.io.OutputStream stream -> stream
    20:22:void <init>(java.io.OutputStream) -> <init>
    27:28:void close() -> close
    33:34:void flush() -> flush
    39:40:void writeASCII(java.lang.String,int) -> writeASCII
    45:46:void writeBigInteger(java.math.BigInteger,int) -> writeBigInteger
    51:52:void writeBoolean(boolean) -> writeBoolean
    57:59:void writeByteArray(byte[],int) -> writeByteArray
    64:68:void writeInt(int) -> writeInt
    73:78:void writeLength(int,int) -> writeLength
    83:85:void writeLong(long) -> writeLong
    90:92:void writeShort(short) -> writeShort
    97:98:void writeString(java.lang.String,int) -> writeString
    103:105:void writeUUID(java.util.UUID) -> writeUUID
    110:111:void writeUnsignedByte(int) -> writeUnsignedByte
    116:122:void writeVarInt(int) -> writeVarInt
    127:133:void writeVarLong(long) -> writeVarLong
launcher.serialize.config.ConfigObject -> launcher.kEepERjerryeNm:
    launcher.serialize.config.entry.BlockConfigEntry block -> block
    18:20:void <init>(launcher.serialize.config.entry.BlockConfigEntry) -> <init>
    25:26:void write(launcher.serialize.HOutput) -> write
launcher.serialize.config.ConfigObject$Adapter -> launcher.keePerJeRrYtsX:
    launcher.serialize.config.ConfigObject convert(launcher.serialize.config.entry.BlockConfigEntry) -> convert
launcher.serialize.config.TextConfigReader -> launcher.keePErJERRyZc0:
    java.io.LineNumberReader reader -> keepErJErRy6HE
    boolean ro -> keepErJErRy6HE
    java.lang.String skipped -> keepErJErRy6HE
    int ch -> keepErJErRy6HE
    20:27:void <init>(java.io.Reader,boolean) -> <init>
    32:32:launcher.serialize.config.entry.BlockConfigEntry read(java.io.Reader,boolean) -> read
    37:37:java.io.IOException newIOException(java.lang.String) -> keepErJErRy6HE
    42:47:int nextChar(boolean) -> keepErJErRy6HE
    52:53:int nextClean(boolean) -> KeePerjeRryt52
    58:100:launcher.serialize.config.entry.BlockConfigEntry readBlock(int) -> keepErJErRy6HE
    106:133:launcher.serialize.config.entry.ConfigEntry readEntry(int) -> keepErJErRy6HE
    139:139:launcher.serialize.config.entry.ConfigEntry readInteger(int) -> KeePerjeRryt52
    144:179:launcher.serialize.config.entry.ConfigEntry readList(int) -> keEPERjERryabM
    184:229:launcher.serialize.config.entry.ConfigEntry readString(int) -> keEpErjeRRYsAK
    235:248:java.lang.String readToken() -> keepErJErRy6HE
    253:258:void skipComment(java.lang.StringBuilder,boolean) -> keepErJErRy6HE
    262:274:int skipWhitespace(boolean) -> keEPERjERryabM
launcher.serialize.config.TextConfigWriter -> launcher.keEpErjerrYZ21:
    java.io.Writer writer -> keepErJErRy6HE
    boolean comments -> keepErJErRy6HE
    19:22:void <init>(java.io.Writer,boolean) -> <init>
    27:28:void write(launcher.serialize.config.entry.BlockConfigEntry,java.io.Writer,boolean) -> write
    33:64:void writeBlock(launcher.serialize.config.entry.BlockConfigEntry,boolean) -> keepErJErRy6HE
    68:69:void writeBoolean(launcher.serialize.config.entry.BooleanConfigEntry) -> keepErJErRy6HE
    73:77:void writeComment(java.lang.String) -> keepErJErRy6HE
    81:102:void writeEntry(launcher.serialize.config.entry.ConfigEntry) -> keepErJErRy6HE
    106:107:void writeInteger(launcher.serialize.config.entry.IntegerConfigEntry) -> keepErJErRy6HE
    111:132:void writeList(launcher.serialize.config.entry.ListConfigEntry) -> keepErJErRy6HE
    136:173:void writeString(launcher.serialize.config.entry.StringConfigEntry) -> keepErJErRy6HE
launcher.serialize.config.TextConfigWriter$1 -> launcher.KeepeRjERryuKZ:
    int[] $SwitchMap$launcher$serialize$config$entry$ConfigEntry$Type -> keepErJErRy6HE
    82:82:void <clinit>() -> <clinit>
launcher.serialize.config.entry.BlockConfigEntry -> launcher.KEEpErJeRrYlil:
    17:18:void <init>(java.util.Map,boolean,int) -> <init>
    23:24:void <init>(int) -> <init>
    29:30:void <init>(launcher.serialize.HInput,boolean) -> <init>
    34:44:java.util.Map readMap(launcher.serialize.HInput,boolean) -> keepErJErRy6HE
    50:50:launcher.serialize.config.entry.ConfigEntry$Type getType() -> getType
    56:57:java.util.Map getValue() -> keepErJErRy6HE
    63:68:void uncheckedSetValue(java.util.Map) -> keepErJErRy6HE
    73:80:void write(launcher.serialize.HOutput) -> write
    85:86:void clear() -> clear
    91:97:launcher.serialize.config.entry.ConfigEntry getEntry(java.lang.String,java.lang.Class) -> getEntry
    103:103:java.lang.Object getEntryValue(java.lang.String,java.lang.Class) -> getEntryValue
    109:109:boolean hasEntry(java.lang.String) -> hasEntry
    115:116:void remove(java.lang.String) -> remove
    121:122:void setEntry(java.lang.String,launcher.serialize.config.entry.ConfigEntry) -> setEntry
    12:12:void uncheckedSetValue(java.lang.Object) -> keepErJErRy6HE
    12:12:java.lang.Object getValue() -> getValue
launcher.serialize.config.entry.BooleanConfigEntry -> launcher.kEEPeRjerry4x5:
    14:15:void <init>(boolean,boolean,int) -> <init>
    20:21:void <init>(launcher.serialize.HInput,boolean) -> <init>
    26:26:launcher.serialize.config.entry.ConfigEntry$Type getType() -> getType
    32:33:void write(launcher.serialize.HOutput) -> write
launcher.serialize.config.entry.ConfigEntry -> launcher.keEPeRjErry4mI:
    boolean ro -> ro
    java.lang.String[] comments -> keepErJErRy6HE
    java.lang.Object value -> keepErJErRy6HE
    21:25:void <init>(java.lang.Object,boolean,int) -> <init>
    29:43:launcher.serialize.config.entry.ConfigEntry readEntry(launcher.serialize.HInput,boolean) -> keepErJErRy6HE
    49:51:void writeEntry(launcher.serialize.config.entry.ConfigEntry,launcher.serialize.HOutput) -> keepErJErRy6HE
    launcher.serialize.config.entry.ConfigEntry$Type getType() -> getType
    59:63:java.lang.String getComment(int) -> getComment
    70:70:java.lang.Object getValue() -> getValue
    76:78:void setValue(java.lang.Object) -> setValue
    83:84:void setComment(int,java.lang.String) -> setComment
    88:92:void ensureWritable() -> keepErJErRy6HE
    97:98:void uncheckedSetValue(java.lang.Object) -> keepErJErRy6HE
launcher.serialize.config.entry.ConfigEntry$1 -> launcher.kEepeRJERrYYjc:
    int[] $SwitchMap$launcher$serialize$config$entry$ConfigEntry$Type -> keepErJErRy6HE
    30:30:void <clinit>() -> <clinit>
launcher.serialize.config.entry.ConfigEntry$Type -> launcher.KeEPeRjErrYptJ:
    launcher.serialize.config.entry.ConfigEntry$Type BLOCK -> BLOCK
    launcher.serialize.config.entry.ConfigEntry$Type BOOLEAN -> BOOLEAN
    launcher.serialize.config.entry.ConfigEntry$Type INTEGER -> INTEGER
    launcher.serialize.config.entry.ConfigEntry$Type STRING -> STRING
    launcher.serialize.config.entry.ConfigEntry$Type LIST -> LIST
    launcher.serialize.stream.EnumSerializer SERIALIZER -> SERIALIZER
    int n -> n
    launcher.serialize.config.entry.ConfigEntry$Type[] $VALUES -> $VALUES
    100:100:launcher.serialize.config.entry.ConfigEntry$Type[] values() -> values
    100:100:launcher.serialize.config.entry.ConfigEntry$Type valueOf(java.lang.String) -> valueOf
    108:110:void <init>(java.lang.String,int,int) -> <init>
    114:114:launcher.serialize.config.entry.ConfigEntry$Type read(launcher.serialize.HInput) -> read
    120:120:int getNumber() -> getNumber
    100:104:void <clinit>() -> <clinit>
launcher.serialize.config.entry.IntegerConfigEntry -> launcher.kEEpErjERRyAWR:
    14:15:void <init>(int,boolean,int) -> <init>
    20:21:void <init>(launcher.serialize.HInput,boolean) -> <init>
    26:26:launcher.serialize.config.entry.ConfigEntry$Type getType() -> getType
    32:33:void write(launcher.serialize.HOutput) -> write
launcher.serialize.config.entry.ListConfigEntry -> launcher.keePerJErrY4Oi:
    18:19:void <init>(java.util.List,boolean,int) -> <init>
    24:25:void <init>(launcher.serialize.HInput,boolean) -> <init>
    29:35:java.util.List readList(launcher.serialize.HInput,boolean) -> keepErJErRy6HE
    41:41:launcher.serialize.config.entry.ConfigEntry$Type getType() -> getType
    47:49:void uncheckedSetValue(java.util.List) -> keepErJErRy6HE
    54:60:void write(launcher.serialize.HOutput) -> write
    65:65:java.util.stream.Stream stream(java.lang.Class) -> stream
    71:75:void verifyOfType(launcher.serialize.config.entry.ConfigEntry$Type) -> verifyOfType
    13:13:void uncheckedSetValue(java.lang.Object) -> keepErJErRy6HE
    71:71:boolean lambda$verifyOfType$0(launcher.serialize.config.entry.ConfigEntry$Type,launcher.serialize.config.entry.ConfigEntry) -> keepErJErRy6HE
launcher.serialize.config.entry.StringConfigEntry -> launcher.KeEpERjErRyhvy:
    14:15:void <init>(java.lang.String,boolean,int) -> <init>
    20:21:void <init>(launcher.serialize.HInput,boolean) -> <init>
    26:26:launcher.serialize.config.entry.ConfigEntry$Type getType() -> getType
    32:33:void uncheckedSetValue(java.lang.String) -> keepErJErRy6HE
    38:39:void write(launcher.serialize.HOutput) -> write
    9:9:void uncheckedSetValue(java.lang.Object) -> keepErJErRy6HE
launcher.serialize.signed.SignedBytesHolder -> launcher.kEePErJERRYtY0:
    byte[] bytes -> keepErJErRy6HE
    byte[] sign -> KeePerjeRryt52
    22:23:void <init>(launcher.serialize.HInput,java.security.interfaces.RSAPublicKey) -> <init>
    27:31:void <init>(byte[],byte[],java.security.interfaces.RSAPublicKey) -> <init>
    35:38:void <init>(byte[],java.security.interfaces.RSAPrivateKey) -> <init>
    43:45:void write(launcher.serialize.HOutput) -> write
    50:50:byte[] getBytes() -> getBytes
    56:56:byte[] getSign() -> getSign
launcher.serialize.signed.SignedObjectHolder -> launcher.kEePerjerryEBg:
    launcher.serialize.stream.StreamObject object -> object
    20:22:void <init>(launcher.serialize.HInput,java.security.interfaces.RSAPublicKey,launcher.serialize.stream.StreamObject$Adapter) -> <init>
    27:29:void <init>(launcher.serialize.stream.StreamObject,java.security.interfaces.RSAPrivateKey) -> <init>
    34:34:boolean equals(java.lang.Object) -> equals
    40:40:int hashCode() -> hashCode
    46:46:java.lang.String toString() -> toString
    52:55:launcher.serialize.stream.StreamObject newInstance(launcher.serialize.stream.StreamObject$Adapter) -> newInstance
launcher.serialize.stream.EnumSerializer -> launcher.kEepeRJErRyW5H:
    java.util.Map map -> keepErJErRy6HE
    15:24:void <init>(java.lang.Class) -> <init>
    29:30:void write(launcher.serialize.HOutput,launcher.serialize.stream.EnumSerializer$Itf) -> write
    35:36:java.lang.Enum read(launcher.serialize.HInput) -> read
launcher.serialize.stream.EnumSerializer$Itf -> launcher.keEPErJErrYbXW:
    int getNumber() -> getNumber
launcher.serialize.stream.StreamObject -> launcher.KEEpeRjerrYruV:
    11:11:void <init>() -> <init>
    void write(launcher.serialize.HOutput) -> write
    21:28:byte[] write() -> write
launcher.serialize.stream.StreamObject$Adapter -> launcher.KeePERJERryk2s:
    launcher.serialize.stream.StreamObject convert(launcher.serialize.HInput) -> convert
