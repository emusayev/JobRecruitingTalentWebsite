# Credentials Folder

## The purpose of this folder is to store all credentials needed to log into your server and databases. This is important for many reasons. But the two most important reasons is
    1. Grading , servers and databases will be logged into to check code and functionality of application. Not changes will be unless directed and coordinated with the team.
    2. Help. If a class TA or class CTO needs to help a team with an issue, this folder will help facilitate this giving the TA or CTO all needed info AND instructions for logging into your team's server. 


# Below is a list of items required. Missing items will causes points to be deducted from multiple milestone submissions.

1. Server URL or IP: 18.190.148.208
2. SSH username aws cloud server : ubuntu
3. SSH password or key : team1group.pem
    <br> If a ssh key is used please upload the key to the credentials folder.
4. Database URL or IP and port used : 18.190.148.208:3306
    <br><strong> NOTE THIS DOES NOT MEAN YOUR DATABASE NEEDS A PUBLIC FACING PORT.</strong> But knowing the IP and port number will help with SSH tunneling into the database. The default port is more than sufficient for this class.
5. Database username : project
6. Database password : 9&xVJb#ec7Sx3EtFm@ztd!
7. Database name : SkillSeek
8. Instructions on how to use the above information.

## Logging into AWS cloud server:
1. Open Mobaxterm. Create a new session and and fill in the remote IP (18.190.148.208). Specify the username as Ubuntu and port 22.
2. Import the key: team1group.pem
3. Connect!

## Logging into MySQL
1. Create a connection.
2. Specify IP: 18.190.148.208 and Port: 3306.
3. Specify Username: project
4. Specify Password: Sfsu2021$
5. Connect!

# Most important things to Remember
## These values need to kept update to date throughout the semester. <br>
## <strong>Failure to do so will result it points be deducted from milestone submissions.</strong><br>
## You may store the most of the above in this README.md file. DO NOT Store the SSH key or any keys in this README.md file.
