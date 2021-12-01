import os, shutil, random, string
if os.path.exists('test_dump'):
    shutil.rmtree('test_dump')

os.makedirs('test_dump')

i = 0
while i < 10000:
    with open('test_dump/' + str(i) + '.txt' , 'w') as f:
        f.write(''.join(random.choice(string.ascii_letters) for x in range(500000)))
    i += 1