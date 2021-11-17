CREATE DEFINER=`project`@`%` PROCEDURE `getProfileInfo`(
IN userName VARCHAR(64)
)
BEGIN
	DECLARE accountType VARCHAR(10);
    
	SELECT users.accType INTO @accountType FROM users WHERE users.username = userName LIMIT 1; 
    
    IF @accountType = 'employer' THEN
		SELECT * FROM users INNER JOIN profileOrg ON users.uid = profileOrg.fk_uid WHERE users.username = userName;
	ELSE
		SELECT users.uid, users.username, users.firstname, users.lastname, users.dateOfBirth, users.accType, profileIndividual.currentProfession, 
        profileIndividual.profilepicture, profileIndividual.resume, profileIndividual.gender, profileIndividual.demographic,
        profileIndividual.description, profileIndividual.location
        FROM users INNER JOIN profileIndividual ON users.uid = profileIndividual.fk_uid 
        WHERE users.username = userName;
	END IF;
END