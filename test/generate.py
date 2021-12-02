import os, shutil, random, string
if os.path.exists('test/test_dump'):
    shutil.rmtree('test/test_dump')

os.makedirs('test/test_dump')

i = 0
while i < 5000:
    with open('test/test_dump/' + str(i) + '.txt' , 'w') as f:
        something = ''.join(random.choice(string.ascii_letters) for x in range(5000000))
        print(something)
        f.write(something)
        print(something)
    i += 1

